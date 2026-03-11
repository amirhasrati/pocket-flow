import { NavLink, type NavLinkRenderProps } from "react-router";

type NavLinkItem = {
	to: string;
	label: string;
	end?: boolean;
};

const navLinks: NavLinkItem[] = [
	{ to: "/", label: "Dashboard", end: true },
	{ to: "/transactions", label: "Transactions" },
	{ to: "/budgets", label: "Budgets" },
];

const navLinkClass = ({ isActive }: NavLinkRenderProps) =>
	[
		"block rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
		isActive
			? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950"
			: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-slate-100",
	].join(" ");

export default function Navbar() {
	return (
		<nav
			aria-label="Primary"
			className="border-b border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:w-72 md:shrink-0 md:border-r md:border-b-0"
		>
			<div className="flex flex-col gap-4 md:gap-6">
				<div className="px-1">
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
						Pocket Flow
					</p>
				</div>
				<div className="flex gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-visible md:pb-0">
					{navLinks.map(({ to, label, end }) => (
						<NavLink key={to} to={to} end={end} className={navLinkClass}>
							{label}
						</NavLink>
					))}
				</div>
			</div>
		</nav>
	);
}
