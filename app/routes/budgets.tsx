import type { Route } from "./+types/budgets";

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "Pocket Flow | Budgets" },
		{
			name: "description",
			content: "Review and manage category budgets in Pocket Flow.",
		},
	];
}

export default function Budgets() {
	return (
		<section className="p-4 sm:p-6">
			<div className="mx-auto max-w-5xl space-y-3">
				<p className="text-sm font-medium text-slate-500 dark:text-slate-400">
					Budgets
				</p>
				<h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
					Plan each month
				</h1>
				<p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
					This section is ready for budget targets, category limits, and monthly
					summaries.
				</p>
			</div>
		</section>
	);
}
