import { Outlet } from "react-router";
import Navbar from "~/components/Navbar/Navbar";

export default function Layout() {
	return (
		<div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 md:flex-row">
			<Navbar />
			<main className="min-w-0 flex-1">
				<Outlet />
			</main>
		</div>
	);
}
