// ** Packages **
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

// ** Components **
import { InputField, PasswordField } from '@/components/FormField';
import Button from '@/components/ui/Button';

// ** Hooks **
import { useLogin } from '../hooks/useLogin';

// ** Validation **
import { loginSchema, type LoginFormValues } from '../validation-schema/login.schema';

const LoginForm = () => {
  const { login, isLoading, error } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: yupResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <form onSubmit={handleSubmit((values) => login(values))} className="space-y-4">
      <InputField<LoginFormValues>
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        register={register}
        errors={errors}
      />

      <PasswordField<LoginFormValues>
        name="password"
        label="Password"
        required
        register={register}
        errors={errors}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" isLoading={isLoading} className="w-full">
        Sign in
      </Button>
    </form>
  );
};

export default LoginForm;
