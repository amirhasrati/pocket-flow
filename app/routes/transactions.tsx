import type { Route } from "./+types/transactions";

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "Pocket Flow | Transactions" },
		{
			name: "description",
			content: "View and manage transaction activity in Pocket Flow.",
		},
	];
}

export default function Transactions() {
	return (
		<section className="p-4 sm:p-6">
			<div className="mx-auto max-w-5xl space-y-3">
				<p className="text-sm font-medium text-slate-500 dark:text-slate-400">
					Transactions
				</p>
				<h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
					Track activity
				</h1>
				<p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
					This section is ready for your transaction list, filters, and entry
					flow.
				</p>
			</div>
		</section>
	);
}
