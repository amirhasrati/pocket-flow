import type { Route } from "./+types/transactions";
import { Form, Link, redirect, useLoaderData, useSearchParams } from "react-router";
import { getTransactionsPage } from "~/models/transactions.server";

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "Pocket Flow | Transactions" },
		{
			name: "description",
			content: "View and manage transaction activity in Pocket Flow.",
		},
	];
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
		throw redirect(canonicalQuery ? `${url.pathname}?${canonicalQuery}` : url.pathname);
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
	year: "numeric",
});

export default function Transactions() {
	const loaderData = useLoaderData<typeof loader>();
	const [searchParams, setSearchParams] = useSearchParams();
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

	return (
		<section className="p-4 sm:p-6">
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
								{(loaderData.filters.q || loaderData.filters.type) && (
									<Link
										to="/transactions"
										className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800"
									>
										Clear
								</Link>
							)}
						</div>
					</Form>
				</div>

				<div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
					<div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between dark:border-slate-800">
						<div>
							<h1 className="text-lg font-semibold text-slate-950 dark:text-slate-100">
								Transactions
							</h1>
							<p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
								Showing {rangeStart}-{rangeEnd} of{" "}
								{loaderData.pagination.totalCount}
							</p>
						</div>
						<p className="text-sm text-slate-500 dark:text-slate-400">
							Sorted by newest first
						</p>
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
											className="transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
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
			</div>
		</section>
	);
}
