import type { Route } from "./+types/transactions";
import {
	Form,
	Link,
	redirect,
	useFetcher,
	useLoaderData,
	useSearchParams,
} from "react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
	createTransaction,
	getTransactionsPage,
} from "~/models/transactions.server";

function formatDateInputValue(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return `${year}-${month}-${day}`;
}

function getTodayDateInputValue() {
	return formatDateInputValue(new Date());
}

function createTransactionSchema() {
	return z.object({
		description: z
			.string()
			.trim()
			.min(1, "Description is required")
			.max(255, "Description must be 255 characters or fewer"),
		amount: z
			.string()
			.trim()
			.min(1, "Amount is required")
			.regex(
				/^\d+(\.\d{1,2})?$/,
				"Amount must be a positive number with up to 2 decimals",
			)
			.refine((value) => Number(value) > 0, "Amount must be greater than 0"),
		categoryId: z.string().trim().min(1, "Category is required"),
		type: z.enum(["INCOME", "EXPENSE"], "Type is required"),
		date: z
			.string()
			.trim()
			.min(1, "Date is required")
			.regex(/^\d{4}-\d{2}-\d{2}$/, "Date is invalid"),
	});
}

type CreateTransactionFormValues = z.infer<
	ReturnType<typeof createTransactionSchema>
>;
type CreateTransactionFieldErrors = Partial<
	Record<keyof CreateTransactionFormValues, string[]>
>;
type CreateTransactionActionData =
	| {
			status: "error";
			fieldErrors: CreateTransactionFieldErrors;
			formError: string | null;
			modalSession: number;
	  }
	| {
			status: "success";
			createdTransactionId: string;
			modalSession: number;
	  };

type ToastState = {
	id: number;
	kind: "success" | "error";
	message: string;
};

const emptyFieldErrors: CreateTransactionFieldErrors = {};

function mapCreateTransactionError(message: string): {
	fieldErrors: CreateTransactionFieldErrors;
	formError: string | null;
} {
	switch (message) {
		case "Amount must be a valid number":
		case "Amount must be greater than 0":
		case "Amount must have at most 2 decimal places":
			return {
				fieldErrors: { amount: [message] },
				formError: null,
			};
		case "Description must be 1-255 characters":
			return {
				fieldErrors: { description: [message] },
				formError: null,
			};
		case "Invalid transaction type":
			return {
				fieldErrors: { type: [message] },
				formError: null,
			};
		case "Invalid transaction date":
		case "Transaction date cannot be in the future":
			return {
				fieldErrors: { date: [message] },
				formError: null,
			};
		case "Category not found for user":
			return {
				fieldErrors: { categoryId: ["Category is no longer available"] },
				formError: null,
			};
		default:
			return {
				fieldErrors: emptyFieldErrors,
				formError: message,
			};
	}
}

function getFormValue(formData: FormData, name: string) {
	const value = formData.get(name);
	return typeof value === "string" ? value : "";
}

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "Pocket Flow | Transactions" },
		{
			name: "description",
			content: "View and manage transaction activity in Pocket Flow.",
		},
	];
}

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const modalSession = Number(getFormValue(formData, "modalSession")) || 0;
	const values = {
		description: getFormValue(formData, "description"),
		amount: getFormValue(formData, "amount"),
		categoryId: getFormValue(formData, "categoryId"),
		type: getFormValue(formData, "type"),
		date: getFormValue(formData, "date"),
	};

	const result = createTransactionSchema().safeParse(values);

	if (!result.success) {
		return {
			status: "error" as const,
			fieldErrors:
				result.error.flatten().fieldErrors as CreateTransactionFieldErrors,
			formError: null,
			modalSession,
		};
	}

	try {
		// TODO: Replace the demo fallback with the authenticated user's identity once auth exists.
		const transaction = await createTransaction({
			userEmail: "demo@pocketflow.local",
			...result.data,
		});

		return {
			status: "success" as const,
			createdTransactionId: transaction.id,
			modalSession,
		};
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unable to create transaction.";
		const { fieldErrors, formError } = mapCreateTransactionError(message);

		return {
			status: "error" as const,
			fieldErrors,
			formError,
			modalSession,
		};
	}
}

export async function loader({ request }: Route.LoaderArgs) {
	const url = new URL(request.url);
	const requestedPage = Number(url.searchParams.get("page") ?? "1");
	const requestedType = url.searchParams.get("type");
	const requestedQuery = url.searchParams.get("q") ?? "";

	// TODO: Replace the demo fallback with the authenticated user's identity once auth exists.
	const data = await getTransactionsPage({
		userEmail: "demo@pocketflow.local",
		page: requestedPage,
		type: requestedType,
		q: requestedQuery,
	});

	const canonicalParams = new URLSearchParams();

	if (data.filters.q) {
		canonicalParams.set("q", data.filters.q);
	}

	if (data.filters.type) {
		canonicalParams.set("type", data.filters.type);
	}

	if (data.pagination.page > 1) {
		canonicalParams.set("page", String(data.pagination.page));
	}

	const currentQuery = url.searchParams.toString();
	const canonicalQuery = canonicalParams.toString();

	if (currentQuery !== canonicalQuery) {
		throw redirect(
			canonicalQuery ? `${url.pathname}?${canonicalQuery}` : url.pathname,
		);
	}

	return data;
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
	currency: "USD",
	style: "currency",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	day: "numeric",
	month: "short",
	timeZone: "UTC",
	year: "numeric",
});

export default function Transactions() {
	const createTransactionFetcher = useFetcher<typeof action>();
	const loaderData = useLoaderData<typeof loader>();
	const [searchParams, setSearchParams] = useSearchParams();
	const [createModalSession, setCreateModalSession] = useState(0);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const [toast, setToast] = useState<ToastState | null>(null);
	const [highlightedTransactionId, setHighlightedTransactionId] = useState<
		string | null
	>(null);
	const createFormRef = useRef<HTMLFormElement>(null);
	const lastHandledResultRef = useRef<string | null>(null);
	const isSubmitting = createTransactionFetcher.state !== "idle";
	const today = getTodayDateInputValue();
	const createTransactionResult =
		createTransactionFetcher.data?.modalSession === createModalSession
			? (createTransactionFetcher.data as CreateTransactionActionData)
			: null;
	const fieldErrors =
		createTransactionResult?.status === "error"
			? createTransactionResult.fieldErrors
			: emptyFieldErrors;
	const formError =
		createTransactionResult?.status === "error"
			? createTransactionResult.formError
			: null;
	const rangeStart =
		loaderData.pagination.totalCount === 0
			? 0
			: (loaderData.pagination.page - 1) * loaderData.pagination.pageSize + 1;
	const rangeEnd = Math.min(
		loaderData.pagination.page * loaderData.pagination.pageSize,
		loaderData.pagination.totalCount,
	);

	function updateFilters(next: { q?: string; type?: string }) {
		const params = new URLSearchParams(searchParams);

		if (next.q !== undefined) {
			if (next.q) {
				params.set("q", next.q);
			} else {
				params.delete("q");
			}
		}

		if (next.type !== undefined) {
			if (next.type) {
				params.set("type", next.type);
			} else {
				params.delete("type");
			}
		}

		params.delete("page");
		setSearchParams(params, { replace: true });
	}

	function getPageHref(page: number) {
		const params = new URLSearchParams();

		if (loaderData.filters.q) {
			params.set("q", loaderData.filters.q);
		}

		if (loaderData.filters.type) {
			params.set("type", loaderData.filters.type);
		}

		if (page > 1) {
			params.set("page", String(page));
		}

		const query = params.toString();
		return query ? `/transactions?${query}` : "/transactions";
	}

	function openCreateModal() {
		setCreateModalSession((currentSession) => currentSession + 1);
		setIsCreateModalOpen(true);
	}

	function closeCreateModal() {
		if (isSubmitting) {
			return;
		}

		setIsCreateModalOpen(false);
	}

	useEffect(() => {
		if (!createTransactionResult) {
			return;
		}

		if (createTransactionResult.status === "success") {
			const resultKey = `success:${createTransactionResult.modalSession}:${createTransactionResult.createdTransactionId}`;

			if (lastHandledResultRef.current === resultKey) {
				return;
			}

			lastHandledResultRef.current = resultKey;
			createFormRef.current?.reset();
			setHighlightedTransactionId(
				createTransactionResult.createdTransactionId,
			);
			setIsCreateModalOpen(false);
			setToast({
				id: Date.now(),
				kind: "success",
				message: "Transaction created.",
			});
			return;
		}

		if (!createTransactionResult.formError) {
			return;
		}

		setToast({
			id: Date.now(),
			kind: "error",
			message: createTransactionResult.formError,
		});
	}, [createTransactionResult]);

	useEffect(() => {
		if (!highlightedTransactionId) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setHighlightedTransactionId(null);
		}, 3000);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [highlightedTransactionId]);

	useEffect(() => {
		if (!toast) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setToast((currentToast) =>
				currentToast?.id === toast.id ? null : currentToast,
			);
		}, 4000);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [toast]);

	return (
		<section className="p-4 sm:p-6">
			{toast ? (
				<div className="pointer-events-none fixed top-4 right-4 z-[60] w-full max-w-sm px-4 sm:top-6 sm:right-6 sm:px-0">
					<div
						role={toast.kind === "error" ? "alert" : "status"}
						aria-live={toast.kind === "error" ? "assertive" : "polite"}
						className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${
							toast.kind === "success"
								? "border-emerald-200 bg-emerald-50/95 text-emerald-950 shadow-emerald-950/10 dark:border-emerald-900 dark:bg-emerald-950/90 dark:text-emerald-100"
								: "border-rose-200 bg-rose-50/95 text-rose-950 shadow-rose-950/10 dark:border-rose-900 dark:bg-rose-950/90 dark:text-rose-100"
						}`}
					>
						<div
							className={`mt-0.5 h-2.5 w-2.5 rounded-full ${
								toast.kind === "success"
									? "bg-emerald-500 dark:bg-emerald-400"
									: "bg-rose-500 dark:bg-rose-400"
							}`}
						/>
						<p className="flex-1 text-sm font-medium">{toast.message}</p>
						<button
							type="button"
							onClick={() => {
								setToast((currentToast) =>
									currentToast?.id === toast.id ? null : currentToast,
								);
							}}
							className="inline-flex h-7 w-7 items-center justify-center rounded-full text-current/70 transition hover:bg-black/5 hover:text-current dark:hover:bg-white/10"
							aria-label="Dismiss notification"
						>
							<svg
								aria-hidden="true"
								viewBox="0 0 20 20"
								className="h-4 w-4"
							>
								<path
									d="m5 5 10 10M15 5 5 15"
									fill="none"
									stroke="currentColor"
									strokeLinecap="round"
									strokeWidth="1.8"
								/>
							</svg>
						</button>
					</div>
				</div>
			) : null}
			<div className="mx-auto flex max-w-6xl flex-col gap-5">
				<div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
					<Form
						method="get"
						className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_auto]"
					>
						<label className="space-y-2">
							<span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
								Search
							</span>
							<input
								type="search"
								name="q"
								value={searchParams.get("q") ?? ""}
								onChange={(event) => {
									updateFilters({ q: event.currentTarget.value });
								}}
								placeholder="Search description or category"
								className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-800"
							/>
						</label>

						<label className="space-y-2">
							<span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
								Type
							</span>
							<div className="relative">
								<select
									name="type"
									value={searchParams.get("type") ?? ""}
									onChange={(event) => {
										updateFilters({ type: event.currentTarget.value });
									}}
									className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
								>
									<option value="">All transactions</option>
									<option value="INCOME">Income</option>
									<option value="EXPENSE">Expenses</option>
								</select>
								<svg
									aria-hidden="true"
									viewBox="0 0 20 20"
									className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
								>
									<path
										d="M5 7.5 10 12.5 15 7.5"
										fill="none"
										stroke="currentColor"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="1.8"
									/>
								</svg>
							</div>
						</label>

						<div className="flex items-end gap-3">
							<button
								type="submit"
								className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus:ring-slate-700"
							>
								Apply filters
							</button>
							{loaderData.filters.q || loaderData.filters.type ? (
								<Link
									to="/transactions"
									className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
								>
									Clear
								</Link>
							) : null}
						</div>
					</Form>
				</div>

				<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
					<div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<h1 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
								Transactions
							</h1>
							<button
								type="button"
								onClick={openCreateModal}
								className="inline-flex min-h-11 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
							>
								Add transaction
							</button>
						</div>
						<div className="mt-2 flex flex-col gap-1 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between dark:text-slate-400">
							<p>
								Showing {rangeStart}-{rangeEnd} of{" "}
								{loaderData.pagination.totalCount}
							</p>
							<p>Sorted by newest first</p>
						</div>
					</div>

					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
							<thead className="bg-slate-50 dark:bg-slate-950/60">
								<tr>
									<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
										Date
									</th>
									<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
										Description
									</th>
									<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
										Category
									</th>
									<th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
										Amount
									</th>
									<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
										Type
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-200 dark:divide-slate-800">
								{loaderData.transactions.length === 0 ? (
									<tr>
										<td
											colSpan={5}
											className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
										>
											No transactions matched those filters.
										</td>
									</tr>
								) : (
									loaderData.transactions.map((tx) => (
										<tr
											key={tx.id}
											className={`transition ${
												highlightedTransactionId === tx.id
													? "bg-emerald-50 dark:bg-emerald-950/30"
													: "hover:bg-slate-50 dark:hover:bg-slate-800/40"
											}`}
										>
											<td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
												{dateFormatter.format(new Date(tx.date))}
											</td>
											<td className="px-5 py-4 text-sm font-medium text-slate-950 dark:text-slate-100">
												{tx.description}
											</td>
											<td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
												{tx.category.name}
											</td>
											<td
												className={`whitespace-nowrap px-5 py-4 text-right text-sm font-semibold tabular-nums ${
													tx.type === "INCOME"
														? "text-emerald-700 dark:text-emerald-300"
														: "text-rose-700 dark:text-rose-300"
												}`}
											>
												{tx.type === "INCOME" ? "+" : "-"}
												{currencyFormatter.format(tx.amount)}
											</td>
											<td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
												{tx.type === "INCOME" ? "Income" : "Expense"}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>

					<div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 dark:border-slate-800">
						{loaderData.pagination.hasPreviousPage ? (
							<Link
								to={getPageHref(loaderData.pagination.page - 1)}
								className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
							>
								Previous
							</Link>
						) : (
							<span className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-300 dark:border-slate-800 dark:text-slate-600">
								Previous
							</span>
						)}
						<p className="text-sm text-slate-500 dark:text-slate-400">
							Page {loaderData.pagination.page}
						</p>

						{loaderData.pagination.hasNextPage ? (
							<Link
								to={getPageHref(loaderData.pagination.page + 1)}
								className="inline-flex min-h-11 items-center rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
							>
								Next
							</Link>
						) : (
							<span className="inline-flex min-h-11 items-center rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-300 dark:border-slate-800 dark:text-slate-600">
								Next
							</span>
						)}
					</div>
				</div>

				{isCreateModalOpen ? (
					<div
						className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
						onClick={closeCreateModal}
					>
						<div
							role="dialog"
							aria-modal="true"
							aria-labelledby="create-transaction-title"
							key={createModalSession}
							className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/40"
							onClick={(event) => {
								event.stopPropagation();
							}}
						>
							<div className="flex items-start justify-between gap-4">
								<div>
									<h2
										id="create-transaction-title"
										className="text-lg font-semibold text-slate-950 dark:text-slate-100"
									>
										Add Transaction
									</h2>
									<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
										Record a new income or expense entry.
									</p>
								</div>
								<button
									type="button"
									onClick={closeCreateModal}
									disabled={isSubmitting}
									className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-slate-500 transition hover:border-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
									aria-label="Close add transaction dialog"
								>
									<svg
										aria-hidden="true"
										viewBox="0 0 20 20"
										className="h-4 w-4"
									>
										<path
											d="m5 5 10 10M15 5 5 15"
											fill="none"
											stroke="currentColor"
											strokeLinecap="round"
											strokeWidth="1.8"
										/>
									</svg>
								</button>
							</div>

							<createTransactionFetcher.Form
								ref={createFormRef}
								method="post"
								className="mt-5 grid gap-4 lg:grid-cols-2"
							>
								<input
									type="hidden"
									name="modalSession"
									value={createModalSession}
								/>
								<label className="space-y-2 lg:col-span-2">
									<span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
										Description
									</span>
									<input
										type="text"
										name="description"
										aria-invalid={fieldErrors.description ? true : undefined}
										className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
									/>
									{fieldErrors.description?.[0] ? (
										<p className="text-sm text-rose-600 dark:text-rose-400">
											{fieldErrors.description[0]}
										</p>
									) : null}
								</label>

								<label className="space-y-2">
									<span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
										Amount
									</span>
									<input
										type="text"
										name="amount"
										inputMode="decimal"
										placeholder="0.00"
										aria-invalid={fieldErrors.amount ? true : undefined}
										className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-slate-500 dark:focus:ring-slate-800"
									/>
									{fieldErrors.amount?.[0] ? (
										<p className="text-sm text-rose-600 dark:text-rose-400">
											{fieldErrors.amount[0]}
										</p>
									) : null}
								</label>

								<label className="space-y-2">
									<span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
										Category
									</span>
									<div className="relative">
										<select
											name="categoryId"
											defaultValue=""
											aria-invalid={fieldErrors.categoryId ? true : undefined}
											className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
										>
											<option value="">Select a category</option>
											{loaderData.categories.map((category) => (
												<option key={category.id} value={category.id}>
													{category.name}
												</option>
											))}
										</select>
										<svg
											aria-hidden="true"
											viewBox="0 0 20 20"
											className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
										>
											<path
												d="M5 7.5 10 12.5 15 7.5"
												fill="none"
												stroke="currentColor"
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="1.8"
											/>
										</svg>
									</div>
									{fieldErrors.categoryId?.[0] ? (
										<p className="text-sm text-rose-600 dark:text-rose-400">
											{fieldErrors.categoryId[0]}
										</p>
									) : null}
								</label>

								<label className="space-y-2">
									<span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
										Type
									</span>
									<div className="relative">
										<select
											name="type"
											defaultValue="EXPENSE"
											aria-invalid={fieldErrors.type ? true : undefined}
											className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-3 pr-11 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
										>
											<option value="EXPENSE">Expense</option>
											<option value="INCOME">Income</option>
										</select>
										<svg
											aria-hidden="true"
											viewBox="0 0 20 20"
											className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
										>
											<path
												d="M5 7.5 10 12.5 15 7.5"
												fill="none"
												stroke="currentColor"
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth="1.8"
											/>
										</svg>
									</div>
									{fieldErrors.type?.[0] ? (
										<p className="text-sm text-rose-600 dark:text-rose-400">
											{fieldErrors.type[0]}
										</p>
									) : null}
								</label>

								<label className="space-y-2">
									<span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
										Date
									</span>
									<input
										type="date"
										name="date"
										defaultValue={today}
										aria-invalid={fieldErrors.date ? true : undefined}
										className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-slate-500 dark:focus:ring-slate-800"
									/>
									{fieldErrors.date?.[0] ? (
										<p className="text-sm text-rose-600 dark:text-rose-400">
											{fieldErrors.date[0]}
										</p>
									) : null}
								</label>

								<div className="flex items-end lg:col-span-2">
									<div className="flex flex-col gap-3">
										<button
											type="submit"
											disabled={isSubmitting || loaderData.categories.length === 0}
											className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:focus:ring-slate-700"
										>
											{isSubmitting ? "Creating..." : "Save transaction"}
										</button>
										{loaderData.categories.length === 0 ? (
											<p className="text-sm text-rose-600 dark:text-rose-400">
												Create a category before adding transactions.
											</p>
										) : null}
										{formError ? (
											<p className="text-sm text-rose-600 dark:text-rose-400">
												{formError}
											</p>
										) : null}
									</div>
								</div>
							</createTransactionFetcher.Form>
						</div>
					</div>
				) : null}
			</div>
		</section>
	);
}
