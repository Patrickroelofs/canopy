import { CaretDownIcon } from "@phosphor-icons/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/integrations/better-auth/auth-client";
import { wordHelpers } from "@/lib/word-helpers";

export function Authenticate() {
	const { data: session, isPending, isRefetching } = authClient.useSession();

	const user = session?.user;
	const isBusy = isPending || isRefetching;

	const handleSignIn = async () => {
		await authClient.signIn.social({
			provider: "github",
		});
	};

	const handleSignOut = async () => {
		await authClient.signOut();
	};

	if (!user) {
		return (
			<Button
				variant="outline"
				size="sm"
				onClick={handleSignIn}
				disabled={isBusy}
			>
				Sign in with GitHub
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						variant="ghost"
						size="sm"
						className="h-auto gap-2 rounded-full px-1.5 py-1"
					>
						<Avatar className="size-8">
							{user.image ? (
								<AvatarImage
									src={user.image}
									alt={user.name ?? user.email ?? "User"}
								/>
							) : null}
							<AvatarFallback>
								{wordHelpers.getInitials(user.name, user.email)}
							</AvatarFallback>
						</Avatar>
						<span className="hidden max-w-40 truncate text-left sm:block">
							{user.name ?? user.email}
						</span>
						<CaretDownIcon className="size-3.5 text-muted-foreground" />
					</Button>
				}
			></DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-64 min-w-0">
				<DropdownMenuGroup>
					<DropdownMenuLabel className="space-y-0.5 py-2">
						<div className="truncate font-medium text-foreground">
							{user.name ?? "GitHub user"}
						</div>
						<div className="truncate text-muted-foreground">{user.email}</div>
					</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={handleSignOut} disabled={isBusy}>
						Sign out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
