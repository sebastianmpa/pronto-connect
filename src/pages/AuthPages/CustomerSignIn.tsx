import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import CustomerLoginForm from "../../components/auth/CustomerLoginForm";

export default function CustomerSignIn() {
  return (
    <>
      <PageMeta
        title="Customer Sign In | TailAdmin"
        description="Customer sign in page"
      />
      <AuthLayout>
        <CustomerLoginForm />
      </AuthLayout>
    </>
  );
}
