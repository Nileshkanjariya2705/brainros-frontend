import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link } from 'react-router-dom';

// ** Components **
import { InputField, SelectField } from '@/components/FormField';
import Button from '@/components/ui/Button';

// ** Hooks & Services **
import { useRegisterStudent } from '../hooks/useRegisterStudent';
import { useGetRegisterOptionsAPI } from '../services';

// ** Validation **
import { registerSchema, type RegisterFormValues } from '../validation-schema/register.schema';
import type { OptionItem } from '../types/auth.types';

const RegisterPage = () => {
  const { registerStudent, isLoading: isRegistering, error: registerError } = useRegisterStudent();
  const { getRegisterOptionsAPI, isLoading: isLoadingOptions } = useGetRegisterOptionsAPI();

  const [classes, setClasses] = useState<OptionItem[]>([]);
  const [languages, setLanguages] = useState<OptionItem[]>([]);
  const [examTargets, setExamTargets] = useState<OptionItem[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      phone: '',
      name: '',
      email: '',
      state: '',
      district: '',
      schoolCollege: '',
      classId: '',
      preferredLanguageId: '',
      examTargetId: '',
    },
  });

  // Fetch register metadata options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      const { data, error } = await getRegisterOptionsAPI();
      if (!error && data) {
        setClasses(data.classes);
        setLanguages(data.languages);
        setExamTargets(data.examTargets);
      } else {
        setOptionsError(error ?? 'Failed to load registration options.');
      }
    };
    fetchOptions();
  }, [getRegisterOptionsAPI]);

  const onSubmit = async (values: RegisterFormValues) => {
    // Send standard registration payload
    await registerStudent({
      phone: values.phone,
      name: values.name,
      email: values.email || undefined,
      state: values.state,
      district: values.district,
      schoolCollege: values.schoolCollege,
      classId: values.classId,
      preferredLanguageId: values.preferredLanguageId,
      examTargetId: values.examTargetId,
    });
  };

  const classOptions = classes.map((c) => ({ label: c.name, value: c.id }));
  const languageOptions = languages.map((l) => ({ label: l.name, value: l.id }));
  const examTargetOptions = examTargets.map((e) => ({ label: e.name, value: e.id }));

  return (
    <div className="w-full max-w-lg space-y-6">
      <div>
        <h1 className="text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Student Registration
        </h1>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your student profile to access exams
        </p>
      </div>

      <div className="bg-white py-8 px-4 shadow-sm rounded-lg sm:px-10 border border-gray-200">
        {isLoadingOptions ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-4">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
            <p className="text-sm text-gray-500">Loading profile configuration options...</p>
          </div>
        ) : optionsError ? (
          <div className="rounded-md bg-red-50 p-4">
            <h3 className="text-sm font-medium text-red-800">Configuration Error</h3>
            <p className="mt-1 text-sm text-red-700">{optionsError}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField<RegisterFormValues>
                name="name"
                label="Full Name"
                placeholder="Nilesh Kanjariya"
                required
                register={register}
                errors={errors}
              />

              <InputField<RegisterFormValues>
                name="phone"
                label="Mobile Number (E.164)"
                placeholder="e.g. +919876543210"
                required
                register={register}
                errors={errors}
              />
            </div>

            <InputField<RegisterFormValues>
              name="email"
              label="Email Address (Optional)"
              type="email"
              placeholder="nilesh@example.com"
              register={register}
              errors={errors}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField<RegisterFormValues>
                name="state"
                label="State"
                placeholder="Gujarat"
                required
                register={register}
                errors={errors}
              />

              <InputField<RegisterFormValues>
                name="district"
                label="District"
                placeholder="Morbi"
                required
                register={register}
                errors={errors}
              />
            </div>

            <InputField<RegisterFormValues>
              name="schoolCollege"
              label="School / College / PUC"
              placeholder="PUC Science College"
              required
              register={register}
              errors={errors}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SelectField<RegisterFormValues>
                name="classId"
                label="Class"
                placeholder="Select Class"
                options={classOptions}
                required
                register={register}
                errors={errors}
              />

              <SelectField<RegisterFormValues>
                name="preferredLanguageId"
                label="Language"
                placeholder="Select Language"
                options={languageOptions}
                required
                register={register}
                errors={errors}
              />

              <SelectField<RegisterFormValues>
                name="examTargetId"
                label="Exam Target"
                placeholder="Select Target"
                options={examTargetOptions}
                required
                register={register}
                errors={errors}
              />
            </div>

            {registerError && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-xs font-medium text-red-700">{registerError}</p>
              </div>
            )}

            <Button type="submit" isLoading={isRegistering} className="w-full mt-2">
              Register Profile
            </Button>
          </form>
        )}
      </div>

      <div className="text-center text-sm text-gray-600">
        <span>Already registered? </span>
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500 transition">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
