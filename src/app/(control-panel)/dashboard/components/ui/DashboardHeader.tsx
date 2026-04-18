import Typography from '@mui/material/Typography';
import PageBreadcrumb from 'src/components/PageBreadcrumb';

function DashboardHeader() {
	return (
		<div className="container flex w-full">
			<div className="flex flex-auto flex-col px-0 py-4">
				<PageBreadcrumb className="mb-2" />
				<div className="flex min-w-0 flex-auto flex-col gap-2 sm:flex-row sm:items-center md:gap-0">
					<div className="flex flex-auto flex-col">
						<Typography className="text-3xl font-semibold tracking-tight">Dashboard</Typography>
						<Typography
							className="font-medium tracking-tight"
							color="text.secondary"
						>
							Overview of your activity and performance
						</Typography>
					</div>
				</div>
			</div>
		</div>
	);
}

export default DashboardHeader;
