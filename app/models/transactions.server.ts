import { Prisma, TransactionType } from "../../generated/prisma/client";
import { db } from "~/lib/db.server";

const DEFAULT_PAGE_SIZE = 20;
const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

type GetTransactionsPageArgs = {
	page?: number;
	pageSize?: number;
	q?: string;
	type?: string | null;
	userEmail: string;
};

type TransactionInput = {
	categoryId: string;
	amount: number | string;
	type: TransactionType;
	description: string;
	date: Date | string;
};

type CreateTransactionArgs = {
	userEmail: string;
} & TransactionInput;

type TransactionUpdate = Partial<TransactionInput>;

type EditTransactionArgs = {
	transactionId: string;
	userEmail: string;
	updates: TransactionUpdate;
};

function normalizePage(page?: number) {
	if (!page || Number.isNaN(page) || page < 1) {
		return 1;
	}

	return Math.floor(page);
}

function normalizePageSize(pageSize?: number) {
	if (!pageSize || Number.isNaN(pageSize) || pageSize < 1) {
		return DEFAULT_PAGE_SIZE;
	}

	return Math.floor(pageSize);
}

function normalizeTransactionType(type?: string | null) {
	if (type === TransactionType.INCOME || type === TransactionType.EXPENSE) {
		return type;
	}

	return null;
}

function parseTransactionDate(date: Date | string) {
	if (date instanceof Date) {
		if (Number.isNaN(date.getTime())) {
			return null;
		}

		return date;
	}

	const trimmedDate = date.trim();
	const matchedDate = DATE_INPUT_PATTERN.exec(trimmedDate);

	if (matchedDate) {
		const [, year, month, day] = matchedDate;
		const normalizedDate = new Date(
			Date.UTC(Number(year), Number(month) - 1, Number(day)),
		);

		if (
			normalizedDate.getUTCFullYear() === Number(year) &&
			normalizedDate.getUTCMonth() === Number(month) - 1 &&
			normalizedDate.getUTCDate() === Number(day)
		) {
			return normalizedDate;
		}

		return null;
	}

	const normalizedDate = new Date(trimmedDate);
	if (Number.isNaN(normalizedDate.getTime())) {
		return null;
	}

	return normalizedDate;
}

function formatLocalDateKey(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function getTodayDateKey() {
	return formatLocalDateKey(new Date());
}

function getTransactionDateKey(inputDate: Date | string, normalizedDate: Date) {
	if (typeof inputDate === "string") {
		const trimmedDate = inputDate.trim();

		if (DATE_INPUT_PATTERN.test(trimmedDate)) {
			return trimmedDate;
		}
	}

	return formatLocalDateKey(normalizedDate);
}

function normalizeTransactionAmount(amount: number | string) {
	const amountInput =
		typeof amount === "string" ? amount.trim() : amount.toString();

	let normalizedAmount: Prisma.Decimal;

	try {
		normalizedAmount = new Prisma.Decimal(amountInput);
	} catch {
		throw new Error("Amount must be a valid number");
	}

	if (!normalizedAmount.isFinite()) {
		throw new Error("Amount must be a valid number");
	}

	if (normalizedAmount.lte(0)) {
		throw new Error("Amount must be greater than 0");
	}

	if (normalizedAmount.decimalPlaces() > 2) {
		throw new Error("Amount must have at most 2 decimal places");
	}

	return normalizedAmount;
}

function normalizeTransactionDescription(description: string) {
	const normalizedDescription = description.trim();
	if (!normalizedDescription || normalizedDescription.length > 255) {
		throw new Error("Description must be 1-255 characters");
	}

	return normalizedDescription;
}

function normalizeTransactionDate(date: Date | string) {
	const normalizedDate = parseTransactionDate(date);
	if (!normalizedDate) {
		throw new Error("Invalid transaction date");
	}

	if (getTransactionDateKey(date, normalizedDate) > getTodayDateKey()) {
		throw new Error("Transaction date cannot be in the future");
	}

	return normalizedDate;
}

async function assertCategoryBelongsToUser(
	userId: string,
	categoryId: string,
) {
	const category = await db.category.findUnique({
		where: {
			id_userId: {
				id: categoryId,
				userId,
			},
		},
		select: { id: true },
	});

	if (!category) throw new Error("Category not found for user");
}

async function buildTransactionWriteData({
	userId,
	updates,
}: {
	userId: string;
	updates: TransactionUpdate;
}) {
	const data: Prisma.TransactionUncheckedUpdateInput = {};

	if (updates.type !== undefined) {
		const normalizedType = normalizeTransactionType(updates.type);
		if (!normalizedType) throw new Error("Invalid transaction type");
		data.type = normalizedType;
	}

	if (updates.amount !== undefined) {
		data.amount = normalizeTransactionAmount(updates.amount);
	}

	if (updates.description !== undefined) {
		data.description = normalizeTransactionDescription(updates.description);
	}

	if (updates.date !== undefined) {
		data.date = normalizeTransactionDate(updates.date);
	}

	if (updates.categoryId !== undefined) {
		await assertCategoryBelongsToUser(userId, updates.categoryId);
		data.categoryId = updates.categoryId;
	}

	return data;
}

export async function getTransactionsPage({
	page,
	pageSize,
	q,
	type,
	userEmail,
}: GetTransactionsPageArgs) {
	const requestedPage = normalizePage(page);
	const normalizedPageSize = normalizePageSize(pageSize);
	const normalizedQuery = q ?? "";
	const normalizedType = normalizeTransactionType(type);

	const user = await db.user.findUnique({
		where: { email: userEmail },
		select: { id: true },
	});

	if (!user) {
		return {
			categories: [],
			filters: {
				page: 1,
				q: normalizedQuery,
				type: normalizedType,
			},
			pagination: {
				hasNextPage: false,
				hasPreviousPage: false,
				page: 1,
				pageSize: normalizedPageSize,
				totalCount: 0,
				totalPages: 0,
			},
			transactions: [],
		};
	}

	const where: Prisma.TransactionWhereInput = {
		userId: user.id,
		...(normalizedType ? { type: normalizedType } : {}),
		...(normalizedQuery
			? {
					OR: [
						{
							description: {
								contains: normalizedQuery,
								mode: "insensitive",
							},
						},
						{
							category: {
								name: {
									contains: normalizedQuery,
									mode: "insensitive",
								},
							},
						},
					],
				}
			: {}),
	};

	const categories = await db.category.findMany({
		where: { userId: user.id },
		orderBy: { name: "asc" },
		select: {
			id: true,
			name: true,
		},
	});

	const totalCount = await db.transaction.count({ where });
	const totalPages =
		totalCount === 0 ? 0 : Math.ceil(totalCount / normalizedPageSize);
	const currentPage =
		totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);
	const skip = (currentPage - 1) * normalizedPageSize;

	const transactions = await db.transaction.findMany({
		where,
		orderBy: [{ date: "desc" }, { createdAt: "desc" }, { id: "desc" }],
		skip,
		take: normalizedPageSize,
		select: {
			id: true,
			amount: true,
			createdAt: true,
			date: true,
			description: true,
			type: true,
			category: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	return {
		categories,
		filters: {
			page: currentPage,
			q: normalizedQuery,
			type: normalizedType,
		},
		pagination: {
			hasNextPage: currentPage < totalPages,
			hasPreviousPage: currentPage > 1,
			page: currentPage,
			pageSize: normalizedPageSize,
			totalCount,
			totalPages,
		},
		transactions: transactions.map((transaction) => ({
			amount: Number(transaction.amount),
			category: transaction.category,
			createdAt: transaction.createdAt.toISOString(),
			date: transaction.date.toISOString(),
			description: transaction.description,
			id: transaction.id,
			type: transaction.type,
		})),
	};
}

export async function createTransaction({
	userEmail,
	categoryId,
	amount,
	type,
	description,
	date,
}: CreateTransactionArgs) {
	const user = await db.user.findUnique({
		where: { email: userEmail },
		select: { id: true },
	});

	if (!user) throw new Error("User not found");
	const data = await buildTransactionWriteData({
		userId: user.id,
		updates: {
			categoryId,
			amount,
			type,
			description,
			date,
		},
	});

	return db.transaction.create({
		data: {
			userId: user.id,
			categoryId: data.categoryId as string,
			amount: data.amount as Prisma.Decimal,
			type: data.type as TransactionType,
			description: data.description as string,
			date: data.date as Date,
		},
	});
}

export async function editTransaction({
	transactionId,
	userEmail,
	updates,
}: EditTransactionArgs) {
	const user = await db.user.findUnique({
		where: { email: userEmail },
		select: { id: true },
	});

	if (!user) throw new Error("User not found");

	const transaction = await db.transaction.findFirst({
		where: {
			id: transactionId,
			userId: user.id,
		},
		select: {
			id: true,
		},
	});

	if (!transaction) throw new Error("Transaction not found for user");
	if (!Object.values(updates).some((value) => value !== undefined)) {
		throw new Error("At least one editable field is required");
	}

	const data = await buildTransactionWriteData({
		userId: user.id,
		updates,
	});

	return db.transaction.update({
		where: { id: transactionId },
		data,
	});
}
