import {
	Menubar,
	MenubarContent,
	MenubarItem,
	MenubarMenu,
	MenubarSub,
	MenubarSubContent,
	MenubarSubTrigger,
	MenubarTrigger,
} from "@/components/ui/menubar";
import { Link } from "@tanstack/react-router";
import { FormInput, Home, Search, Server, Store, Table } from "lucide-react";

/** Site header with menubar navigation */
const Header = () => {
	const formItems = [
		{
			title: "Simple Form",
			to: "/demo/form/simple",
			description: "A basic form for quick input.",
		},
		{
			title: "Address Form",
			to: "/demo/form/address",
			description: "Form for capturing address details.",
		},
	];

	const startItems = [
		{
			title: "Server Functions",
			to: "/demo/start/server-funcs",
			description: "Server-side function demonstrations.",
		},
		{
			title: "API Request",
			to: "/demo/start/api-request",
			description: "Client-side API request examples.",
		},
	];

	const pooItems = [
		{ title: "photos", to: "/photos", description: "Some Photos" },
		{ title: "Poo nanu", to: "/poo/nanu", description: "The Nanu" },
	];

	return (
		<header className="p-2 flex bg-gray-900 justify-center">
			<Menubar>
				<MenubarMenu>
					<Link to="/">
						<MenubarTrigger className="font-bold flex items-center">
							<Home className="h-4 w-4 mr-2" /> Home
						</MenubarTrigger>
					</Link>
				</MenubarMenu>

				<MenubarMenu>
					<MenubarTrigger className="font-bold flex items-center">
						<FormInput className="h-4 w-4 mr-2" /> Forms
					</MenubarTrigger>
					<MenubarContent>
						{formItems.map((item) => (
							<Link key={item.title} to={item.to}>
								<MenubarItem>{item.title}</MenubarItem>
							</Link>
						))}
					</MenubarContent>
				</MenubarMenu>

				<MenubarMenu>
					<MenubarTrigger className="font-bold flex items-center">
						<Server className="h-4 w-4 mr-2" /> Start
					</MenubarTrigger>
					<MenubarContent>
						{startItems.map((item) => (
							<Link key={item.title} to={item.to}>
								<MenubarItem>{item.title}</MenubarItem>
							</Link>
						))}
					</MenubarContent>
				</MenubarMenu>

				<MenubarMenu>
					<Link to="/demo/store">
						<MenubarTrigger className="font-bold flex items-center">
							<Store className="h-4 w-4 mr-2" /> Store
						</MenubarTrigger>
					</Link>
					<MenubarContent>
						<MenubarItem>
							<Link to="/demo/store">Go to Store</Link>
						</MenubarItem>
					</MenubarContent>
				</MenubarMenu>

				<MenubarMenu>
					<Link to="/demo/table">
						<MenubarTrigger className="font-bold flex items-center">
							<Table className="h-4 w-4 mr-2" /> TanStack Table
						</MenubarTrigger>
					</Link>
					<MenubarContent>
						<MenubarItem>
							<Link to="/demo/table">Go to TanStack Table</Link>
						</MenubarItem>
					</MenubarContent>
				</MenubarMenu>

				<MenubarMenu>
					<Link to="/demo/tanstack-query">
						<MenubarTrigger className="font-bold flex items-center">
							<Search className="h-4 w-4 mr-2" /> TanStack Query
						</MenubarTrigger>
					</Link>
					<MenubarContent>
						<MenubarItem>
							<Link to="/demo/tanstack-query">Go to TanStack Query</Link>
						</MenubarItem>
					</MenubarContent>
				</MenubarMenu>

				<MenubarMenu>
					<MenubarTrigger className="font-bold flex items-center">
						<Server className="h-4 w-4 mr-2" /> Poo
					</MenubarTrigger>
					<MenubarContent>
						{pooItems.map((item) => (
							<Link key={item.title} to={item.to}>
								<MenubarItem>{item.title}</MenubarItem>
							</Link>
						))}
					</MenubarContent>
				</MenubarMenu>
			</Menubar>
		</header>
	);
};

export default Header;
