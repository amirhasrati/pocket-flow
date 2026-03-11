import type { Prisma } from "../../generated/prisma/client";
import { TransactionType } from "../../generated/prisma/client";
import { db } from "~/lib/db.server";

const DEFAULT_PAGE_SIZE = 20;

type GetTransactionsPageArgs = {
	page?: number;
	pageSize?: number;
	q?: string;
	type?: string | null;
	userEmail: string;
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

	const totalCount = await db.transaction.count({ where });
	const totalPages =
		totalCount === 0 ? 0 : Math.ceil(totalCount / normalizedPageSize);
	const currentPage = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);
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
