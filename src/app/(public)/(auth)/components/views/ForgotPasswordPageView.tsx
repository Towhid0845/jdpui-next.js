import Paper from '@mui/material/Paper';
import ForgotPasswordForm from '../forms/ForgotPasswordForm';
import ForgotPasswordPageTitle from '../ui/ForgotPasswordPageTitle';
import AuthPagesMessageSection from '../ui/AuthPagesMessageSection';

function ForgotPasswordPageView() {
	return (
		<div className="flex min-w-0 flex-auto flex-col items-center sm:flex-row sm:justify-center md:items-start md:justify-start">
			<Paper className="h-full w-full px-4 py-2 sm:h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm md:flex md:h-full md:w-1/2 md:items-center md:justify-end md:rounded-none md:p-16 md:shadow-none ltr:border-r-1 rtl:border-l-1">
				<div className="mx-auto flex w-full max-w-80 flex-col gap-8 sm:mx-0 sm:w-80">
					<ForgotPasswordPageTitle />
					<ForgotPasswordForm />
				</div>
			</Paper>

			<AuthPagesMessageSection />
		</div>
	);
}

export default ForgotPasswordPageView;
