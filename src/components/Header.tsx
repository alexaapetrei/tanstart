import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
	NavigationMenuTrigger,
	navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { FormInput, Home, Search, Server, Store, Table } from "lucide-react";
import * as React from "react";

/** Site header with enhanced dropdown navigation */
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
		{
			title: "poo",
			to: "/poo",
			description: "Some Poo",
		},
		{
			title: "Poo nanu",
			to: "/poo/nanu",
			description: "The Nanu",
		},
	];

	return (
		<header className="p-2 flex justify-between bg-white text-black">
			<NavigationMenu>
				<NavigationMenuList className="flex flex-row gap-4 items-center">
					<NavigationMenuItem>
						<Link to="/">
							<NavigationMenuLink
								className={cn(navigationMenuTriggerStyle(), "font-bold")}
							>
								<Home className="h-4 w-4 mr-2" /> Home
							</NavigationMenuLink>
						</Link>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<NavigationMenuTrigger
							className={cn(navigationMenuTriggerStyle(), "font-bold")}
						>
							<FormInput className="h-4 w-4 mr-2" /> Forms
						</NavigationMenuTrigger>
						<NavigationMenuContent>
							<ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
								{formItems.map((item) => (
									<ListItem key={item.title} title={item.title} to={item.to}>
										{item.description}
									</ListItem>
								))}
							</ul>
						</NavigationMenuContent>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<NavigationMenuTrigger
							className={cn(navigationMenuTriggerStyle(), "font-bold")}
						>
							<Server className="h-4 w-4 mr-2" /> Start
						</NavigationMenuTrigger>
						<NavigationMenuContent>
							<ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
								{startItems.map((item) => (
									<ListItem key={item.title} title={item.title} to={item.to}>
										{item.description}
									</ListItem>
								))}
							</ul>
						</NavigationMenuContent>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<Link to="/demo/store">
							<NavigationMenuLink
								className={cn(navigationMenuTriggerStyle(), "font-bold")}
							>
								<Store className="h-4 w-4 mr-2" /> Store
							</NavigationMenuLink>
						</Link>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<Link to="/demo/table">
							<NavigationMenuLink
								className={cn(navigationMenuTriggerStyle(), "font-bold")}
							>
								<Table className="h-4 w-4 mr-2" /> TanStack Table
							</NavigationMenuLink>
						</Link>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<Link to="/demo/tanstack-query">
							<NavigationMenuLink
								className={cn(navigationMenuTriggerStyle(), "font-bold")}
							>
								<Search className="h-4 w-4 mr-2" /> TanStack Query
							</NavigationMenuLink>
						</Link>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<NavigationMenuTrigger
							className={cn(navigationMenuTriggerStyle(), "font-bold")}
						>
							<Server className="h-4 w-4 mr-2" /> Poo
						</NavigationMenuTrigger>
						<NavigationMenuContent>
							<ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
								{pooItems.map((item) => (
									<ListItem key={item.title} title={item.title} to={item.to}>
										{item.description}
									</ListItem>
								))}
							</ul>
						</NavigationMenuContent>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>
		</header>
	);
};

const ListItem = React.forwardRef<
	React.ElementRef<"a">,
	React.ComponentPropsWithoutRef<"a"> & { to: string }
>(({ className, title, children, to, ...props }, ref) => (
	<li>
		<NavigationMenuLink asChild>
			<Link
				to={to}
				ref={ref}
				className={cn(
					"block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
					className,
				)}
				{...props}
			>
				<div className="text-sm font-medium leading-none">{title}</div>
				<p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
					{children}
				</p>
			</Link>
		</NavigationMenuLink>
	</li>
));
ListItem.displayName = "ListItem";

export default Header;
