process.loadEnvFile?.(".env");

import { PrismaPg } from "@prisma/adapter-pg";
import {
	BudgetMonth,
	PrismaClient,
	TransactionType,
} from "../generated/prisma/client.ts";

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is required to seed the database.");
}

const DEMO_USER = {
	name: "Demo User",
	email: "demo@pocketflow.local",
};

const CATEGORY_NAMES = [
	"Salary",
	"Freelance",
	"Housing",
	"Groceries",
	"Dining",
	"Transportation",
	"Utilities",
	"Entertainment",
	"Health",
	"Shopping",
	"Travel",
] as const;

const BUDGET_MONTHS = [
	BudgetMonth.JAN,
	BudgetMonth.FEB,
	BudgetMonth.MAR,
	BudgetMonth.APR,
	BudgetMonth.MAY,
	BudgetMonth.JUN,
	BudgetMonth.JUL,
	BudgetMonth.AUG,
	BudgetMonth.SEP,
	BudgetMonth.OCT,
	BudgetMonth.NOV,
	BudgetMonth.DEC,
] as const;

const BUDGET_FIXTURES = [
	{ category: "Housing", amount: "1800.00", monthOffset: 0 },
	{ category: "Groceries", amount: "500.00", monthOffset: 0 },
	{ category: "Dining", amount: "250.00", monthOffset: 0 },
	{ category: "Transportation", amount: "180.00", monthOffset: 0 },
	{ category: "Utilities", amount: "220.00", monthOffset: 0 },
	{ category: "Entertainment", amount: "150.00", monthOffset: 0 },
	{ category: "Health", amount: "120.00", monthOffset: 0 },
	{ category: "Shopping", amount: "200.00", monthOffset: 0 },
	{ category: "Travel", amount: "300.00", monthOffset: 0 },
	{ category: "Housing", amount: "1800.00", monthOffset: -1 },
	{ category: "Groceries", amount: "450.00", monthOffset: -1 },
	{ category: "Dining", amount: "225.00", monthOffset: -1 },
	{ category: "Transportation", amount: "160.00", monthOffset: -1 },
	{ category: "Utilities", amount: "210.00", monthOffset: -1 },
	{ category: "Entertainment", amount: "140.00", monthOffset: -1 },
	{ category: "Health", amount: "100.00", monthOffset: -1 },
	{ category: "Shopping", amount: "175.00", monthOffset: -1 },
] as const;

const TRANSACTION_FIXTURES = [
	{
		category: "Salary",
		type: TransactionType.INCOME,
		amount: "2100.00",
		description: "Biweekly payroll deposit",
		daysAgo: 35,
		hour: 13,
	},
	{
		category: "Housing",
		type: TransactionType.EXPENSE,
		amount: "1800.00",
		description: "Rent payment",
		daysAgo: 33,
		hour: 9,
	},
	{
		category: "Utilities",
		type: TransactionType.EXPENSE,
		amount: "96.40",
		description: "Hydro and water bill",
		daysAgo: 31,
		hour: 10,
	},
	{
		category: "Groceries",
		type: TransactionType.EXPENSE,
		amount: "84.72",
		description: "Weekend grocery run",
		daysAgo: 30,
		hour: 17,
	},
	{
		category: "Dining",
		type: TransactionType.EXPENSE,
		amount: "18.50",
		description: "Sushi lunch",
		daysAgo: 28,
		hour: 12,
	},
	{
		category: "Transportation",
		type: TransactionType.EXPENSE,
		amount: "42.00",
		description: "Gas refill",
		daysAgo: 27,
		hour: 18,
	},
	{
		category: "Entertainment",
		type: TransactionType.EXPENSE,
		amount: "14.99",
		description: "Streaming subscription",
		daysAgo: 25,
		hour: 8,
	},
	{
		category: "Freelance",
		type: TransactionType.INCOME,
		amount: "750.00",
		description: "Landing page copy edits",
		daysAgo: 24,
		hour: 15,
	},
	{
		category: "Dining",
		type: TransactionType.EXPENSE,
		amount: "52.40",
		description: "Dinner with friends",
		daysAgo: 23,
		hour: 20,
	},
	{
		category: "Groceries",
		type: TransactionType.EXPENSE,
		amount: "63.18",
		description: "Midweek groceries",
		daysAgo: 22,
		hour: 18,
	},
	{
		category: "Health",
		type: TransactionType.EXPENSE,
		amount: "24.00",
		description: "Pharmacy pickup",
		daysAgo: 20,
		hour: 16,
	},
	{
		category: "Shopping",
		type: TransactionType.EXPENSE,
		amount: "89.90",
		description: "Desk accessories",
		daysAgo: 18,
		hour: 14,
	},
	{
		category: "Transportation",
		type: TransactionType.EXPENSE,
		amount: "27.50",
		description: "Airport rideshare",
		daysAgo: 17,
		hour: 6,
	},
	{
		category: "Travel",
		type: TransactionType.EXPENSE,
		amount: "210.00",
		description: "Train tickets",
		daysAgo: 16,
		hour: 11,
	},
	{
		category: "Housing",
		type: TransactionType.EXPENSE,
		amount: "1800.00",
		description: "Rent payment",
		daysAgo: 15,
		hour: 9,
	},
	{
		category: "Utilities",
		type: TransactionType.EXPENSE,
		amount: "118.33",
		description: "Internet and mobile bill",
		daysAgo: 13,
		hour: 10,
	},
	{
		category: "Groceries",
		type: TransactionType.EXPENSE,
		amount: "41.05",
		description: "Produce market stop",
		daysAgo: 12,
		hour: 17,
	},
	{
		category: "Dining",
		type: TransactionType.EXPENSE,
		amount: "8.75",
		description: "Coffee and breakfast sandwich",
		daysAgo: 11,
		hour: 9,
	},
	{
		category: "Freelance",
		type: TransactionType.INCOME,
		amount: "380.00",
		description: "Newsletter consulting session",
		daysAgo: 10,
		hour: 14,
	},
	{
		category: "Entertainment",
		type: TransactionType.EXPENSE,
		amount: "36.00",
		description: "Movie tickets",
		daysAgo: 9,
		hour: 19,
	},
	{
		category: "Transportation",
		type: TransactionType.EXPENSE,
		amount: "55.40",
		description: "Gas refill",
		daysAgo: 8,
		hour: 18,
	},
	{
		category: "Groceries",
		type: TransactionType.EXPENSE,
		amount: "91.12",
		description: "Warehouse store top-up",
		daysAgo: 7,
		hour: 16,
	},
	{
		category: "Health",
		type: TransactionType.EXPENSE,
		amount: "68.00",
		description: "Physio copay",
		daysAgo: 6,
		hour: 13,
	},
	{
		category: "Dining",
		type: TransactionType.EXPENSE,
		amount: "27.80",
		description: "Lunch meeting",
		daysAgo: 5,
		hour: 12,
	},
	{
		category: "Shopping",
		type: TransactionType.EXPENSE,
		amount: "64.25",
		description: "Running shoes",
		daysAgo: 4,
		hour: 18,
	},
	{
		category: "Salary",
		type: TransactionType.INCOME,
		amount: "2100.00",
		description: "Biweekly payroll deposit",
		daysAgo: 3,
		hour: 13,
	},
	{
		category: "Utilities",
		type: TransactionType.EXPENSE,
		amount: "72.10",
		description: "Internet and mobile bill",
		daysAgo: 2,
		hour: 10,
	},
	{
		category: "Groceries",
		type: TransactionType.EXPENSE,
		amount: "39.60",
		description: "Neighborhood market stop",
		daysAgo: 1,
		hour: 18,
	},
	{
		category: "Dining",
		type: TransactionType.EXPENSE,
		amount: "14.20",
		description: "Quick lunch",
		daysAgo: 0,
		hour: 12,
	},
] as const;

function startOfTodayUtc() {
	const now = new Date();
	return new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
	);
}

function daysAgo(baseDate: Date, offset: number, hour = 12) {
	const date = new Date(baseDate);
	date.setUTCDate(date.getUTCDate() - offset);
	date.setUTCHours(hour, 0, 0, 0);
	return date;
}

function monthOffset(baseDate: Date, offset: number) {
	return new Date(
		Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth() + offset, 1, 12),
	);
}

function toBudgetMonth(date: Date) {
	return BUDGET_MONTHS[date.getUTCMonth()];
}

function getCategoryId(
	categoryIdByName: Record<string, string>,
	categoryName: string,
) {
	const categoryId = categoryIdByName[categoryName];

	if (!categoryId) {
		throw new Error(`Missing category id for "${categoryName}".`);
	}

	return categoryId;
}

const db = new PrismaClient({
	adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
	log: ["error"],
});

async function main() {
	const baseDate = startOfTodayUtc();

	const result = await db.$transaction(async (tx) => {
		const user = await tx.user.upsert({
			where: { email: DEMO_USER.email },
			update: { name: DEMO_USER.name },
			create: DEMO_USER,
		});

		await tx.transaction.deleteMany({
			where: { userId: user.id },
		});
		await tx.budget.deleteMany({
			where: { userId: user.id },
		});
		await tx.category.deleteMany({
			where: { userId: user.id },
		});

		const categoryIdByName: Record<string, string> = {};

		for (const categoryName of CATEGORY_NAMES) {
			const category = await tx.category.create({
				data: {
					name: categoryName,
					userId: user.id,
				},
			});

			categoryIdByName[categoryName] = category.id;
		}

		await tx.budget.createMany({
			data: BUDGET_FIXTURES.map((budget) => {
				const budgetDate = monthOffset(baseDate, budget.monthOffset);

				return {
					userId: user.id,
					categoryId: getCategoryId(categoryIdByName, budget.category),
					amount: budget.amount,
					month: toBudgetMonth(budgetDate),
					year: budgetDate.getUTCFullYear(),
				};
			}),
		});

		await tx.transaction.createMany({
			data: TRANSACTION_FIXTURES.map((transaction) => ({
				userId: user.id,
				categoryId: getCategoryId(categoryIdByName, transaction.category),
				amount: transaction.amount,
				type: transaction.type,
				description: transaction.description,
				date: daysAgo(baseDate, transaction.daysAgo, transaction.hour),
			})),
		});

		const [categoryCount, budgetCount, transactionCount] = await Promise.all([
			tx.category.count({ where: { userId: user.id } }),
			tx.budget.count({ where: { userId: user.id } }),
			tx.transaction.count({ where: { userId: user.id } }),
		]);

		return {
			user,
			categoryCount,
			budgetCount,
			transactionCount,
		};
	});

	console.log(
		[
			`Seeded mock data for ${result.user.email}.`,
			`Categories: ${result.categoryCount}`,
			`Budgets: ${result.budgetCount}`,
			`Transactions: ${result.transactionCount}`,
		].join(" "),
	);
}

main()
	.catch((error) => {
		console.error("Database seed failed.");
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$disconnect();
	});
