import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import AtcLoginForm from "../../components/auth/AtcLoginForm";

export default function AtcSignIn() {
  return (
    <>
      <PageMeta
        title="Sign In | Pronto Connect"
        description="Sign in to Pronto Connect"
      />
      <AuthLayout>
        <AtcLoginForm />
      </AuthLayout>
    </>
  );
}
