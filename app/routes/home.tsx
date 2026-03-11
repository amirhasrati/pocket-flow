import type { Route } from "./+types/home";
import { Link } from "react-router";

const quickLinks = [
	{
		to: "/transactions",
		title: "Transactions",
		description: "Review recent activity and keep spending organized.",
	},
	{
		to: "/budgets",
		title: "Budgets",
		description: "Set monthly targets and keep each category on track.",
	},
];

export function meta(_args: Route.MetaArgs) {
	return [
		{ title: "Pocket Flow | Dashboard" },
		{
			name: "description",
			content:
				"Pocket Flow dashboard with quick access to budgets and transactions.",
		},
	];
}

export default function Home() {
	return (
		<section className="p-4 sm:p-6">
			<div className="mx-auto max-w-5xl space-y-8">
				<div className="space-y-3">
					<p className="text-sm font-medium text-slate-500 dark:text-slate-400">
						Dashboard
					</p>
					<div className="space-y-2">
						<h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
							Manage your budget in one place
						</h1>
						<p className="max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
							Start from the dashboard, then drill into your transactions or
							monthly budgets as you build out the app.
						</p>
					</div>
				</div>

				<div className="grid gap-4 md:grid-cols-2">
					{quickLinks.map(({ to, title, description }) => (
						<Link
							key={to}
							to={to}
							className="rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-800"
						>
							<p className="text-lg font-semibold text-slate-950 dark:text-slate-100">
								{title}
							</p>
							<p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
								{description}
							</p>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
