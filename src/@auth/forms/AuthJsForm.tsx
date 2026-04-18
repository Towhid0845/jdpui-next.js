import AuthJsCredentialsSignInForm from './AuthJsCredentialsSignInForm';
import AuthJsCredentialsSignUpForm from './AuthJsCredentialsSignUpForm';

type AuthJsFormProps = { formType: 'signin' | 'signup' };

function AuthJsForm(props: AuthJsFormProps) {
	const { formType = 'signin' } = props;

	return (
		<div className="flex flex-col space-y-8">
			{formType === 'signin' && <AuthJsCredentialsSignInForm />}
			{formType === 'signup' && <AuthJsCredentialsSignUpForm />}
		</div>
	);
}

export default AuthJsForm;
