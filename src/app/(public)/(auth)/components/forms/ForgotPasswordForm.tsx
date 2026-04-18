'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { Alert } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import _ from 'lodash';
import { authForgotPassword } from '@/api/services/auth';

const schema = z.object({
	email: z.string().email('You must enter a valid email').nonempty('You must enter an email')
});

type FormType = z.infer<typeof schema>;

const defaultValues: FormType = {
	email: ''
};

function ForgotPasswordForm() {
	const { control, formState, handleSubmit, setValue } = useForm<FormType>({
		mode: 'onChange',
		defaultValues,
		resolver: zodResolver(schema)
	});

	const { isValid, dirtyFields, errors } = formState;
	const searchParams = useSearchParams();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitMessage, setSubmitMessage] = useState<string | null>(null);

	useEffect(() => {
		const emailParam = searchParams.get('email');
		if (emailParam) {
			setValue('email', emailParam, { shouldDirty: false, shouldValidate: true });
		}
	}, [searchParams, setValue]);

	async function onSubmit(formData: FormType) {
		setSubmitError(null);
		setSubmitMessage(null);
		setIsSubmitting(true);

		try {
			const response = await authForgotPassword(formData.email);

			if (response && typeof response === 'object') {
				const payload = response as {
					IsExternal?: boolean;
					Domain?: string;
					Message?: string;
					ErrorMessages?: Record<string, string>;
				};

				if (payload.IsExternal && payload.Domain) {
					window.location.replace(payload.Domain);
					return;
				}

				if (payload.Message && payload.ErrorMessages && Object.keys(payload.ErrorMessages).length > 0) {
					setSubmitError(payload.Message);
					setIsSubmitting(false);
					return;
				}
			}

			setSubmitMessage(
				typeof response === 'string'
					? response
					: 'If this email exists, a reset link has been sent.'
			);
		} catch (error) {
			setSubmitError('Something went wrong. Please try again.');
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<form
			name="forgotPasswordForm"
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
			<Controller
				name="email"
				control={control}
				render={({ field }) => (
					<TextField
						{...field}
						className="mb-6"
						label="Email"
						autoFocus
						type="email"
						error={!!errors.email}
						helperText={errors?.email?.message}
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
				aria-label="Send reset link"
				disabled={_.isEmpty(dirtyFields) || !isValid || isSubmitting}
				type="submit"
				size="large"
			>
				Send reset link
			</Button>
		</form>
	);
}

export default ForgotPasswordForm;
