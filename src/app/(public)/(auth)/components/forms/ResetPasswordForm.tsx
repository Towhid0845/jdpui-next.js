'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState } from 'react';
import { z } from 'zod';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { Alert } from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import _ from 'lodash';
import { authResetPassword } from '@/api/services/auth';
import { useAuth } from '@auth/AuthProvider';

const schema = z
	.object({
		password: z.string().min(6, 'Password is too short - should be 6 chars minimum.'),
		passwordConfirm: z.string().nonempty('Password confirmation is required')
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: 'Passwords must match',
		path: ['passwordConfirm']
	});

type FormType = z.infer<typeof schema>;

const defaultValues: FormType = {
	password: '',
	passwordConfirm: ''
};

function ResetPasswordForm() {
	const { control, formState, handleSubmit } = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema)
	});

	const { isValid, dirtyFields, errors } = formState;
	const searchParams = useSearchParams();
	const router = useRouter();
	const { signInExternal } = useAuth();

	const email = searchParams.get('email') || '';
	const code = searchParams.get('code') || searchParams.get('shortCode') || '';

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitMessage, setSubmitMessage] = useState<string | null>(null);

	const canSubmit = useMemo(() => email && code && isValid && !_.isEmpty(dirtyFields), [email, code, isValid, dirtyFields]);

	async function onSubmit(formData: FormType) {
		setSubmitError(null);
		setSubmitMessage(null);
		setIsSubmitting(true);

		try {
			const response = await authResetPassword({
				Email: email,
				Code: code,
				Password: formData.password
			});

			if (response && typeof response === 'object') {
				const payload = response as {
					Message?: string;
					ErrorMessages?: Record<string, string>;
					token?: string;
					Token?: string;
					email?: string;
					Email?: string;
				};

				if (payload.Message && payload.ErrorMessages && Object.keys(payload.ErrorMessages).length > 0) {
					setSubmitError(payload.Message);
					setIsSubmitting(false);
					return;
				}

				const token = payload.token || payload.Token;
				const responseEmail = payload.email || payload.Email || email;

				if (token && responseEmail) {
					const result = await signInExternal({
						token,
						email: responseEmail,
						isMobile: false
					});

					if (result.ok) {
						router.replace('/candidates/overview');
						return;
					}

					setSubmitMessage('Password reset successful. Please sign in.');
					return;
				}
			}

			setSubmitMessage('Password reset successful. Please sign in.');
		} catch (error) {
			setSubmitError('Something went wrong. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form
			name="resetPasswordForm"
			noValidate
			className="flex w-full flex-col justify-center"
			onSubmit={handleSubmit(onSubmit)}
		>
			{submitError && (
				<Alert
					className="mb-6"
					severity="error"
				>
					{submitError}
				</Alert>
			)}
			{submitMessage && (
				<Alert
					className="mb-6"
					severity="success"
				>
					{submitMessage}
				</Alert>
			)}
			{!email || !code ? (
				<Alert
					className="mb-6"
					severity="warning"
				>
					Missing reset link details. Please use the link from your email.
				</Alert>
			) : null}
			<Controller
				name="password"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="New password"
						type="password"
						error={!!errors.password}
						helperText={errors?.password?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>
			<Controller
				name="passwordConfirm"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Confirm password"
						type="password"
						error={!!errors.passwordConfirm}
						helperText={errors?.passwordConfirm?.message}
						variant="outlined"
						required
						fullWidth
					/>
				)}
			/>
			<Button
				variant="contained"
				color="secondary"
				className="mt-2 w-full"
				aria-label="Reset password"
				disabled={!canSubmit || isSubmitting}
				type="submit"
				size="large"
			>
				Reset password
			</Button>
		</form>
	);
}

export default ResetPasswordForm;
