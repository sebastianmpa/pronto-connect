import { BrowserRouter as Router, Routes, Route } from "react-router";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AtcSignIn from "./pages/AuthPages/AtcSignIn";
import OrdersList from "./pages/Orders/OrdersList";
import OrderDetail from "./pages/Orders/OrderDetail";
import SmsLogsList from "./pages/SmsLogs/SmsLogsList";
import SmsLogDetail from "./pages/SmsLogs/SmsLogDetail";
import CustomersList from "./pages/Customers/CustomersList";
import CustomerDetail from "./pages/Customers/CustomerDetail";
import TicketsList from "./pages/Tickets/TicketsList";
import TicketDetail from "./pages/Tickets/TicketDetail";
import SmsTemplatesList from "./pages/SmsTemplates/SmsTemplatesList";
import EmailTemplatesList from "./pages/EmailTemplates/EmailTemplatesList";
import CancellationsList from "./pages/Cancellations/CancellationsList";
import CancellationDetail from "./pages/Cancellations/CancellationDetail";
import ClosureMethodsList from "./pages/ClosureMethods/ClosureMethodsList";
import ContactReasonsList from "./pages/ContactReasons/ContactReasonsList";
import CustomerContactsList from "./pages/CustomerContacts/CustomerContactsList";
import CustomerContactDetail from "./pages/CustomerContacts/CustomerContactDetail";
import PermissionsList from "./pages/Permissions/PermissionsList";
import RolesList from "./pages/Roles/RolesList";
import UsersList from "./pages/Users/UsersList";
import Stocks from "./pages/Dashboard/Stocks";
import Crm from "./pages/Dashboard/Crm";
import Marketing from "./pages/Dashboard/Marketing";
import Analytics from "./pages/Dashboard/Analytics";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import UserProfiles from "./pages/UserProfiles";
import Carousel from "./pages/UiElements/Carousel";
import Maintenance from "./pages/OtherPage/Maintenance";
import FiveZeroZero from "./pages/OtherPage/FiveZeroZero";
import FiveZeroThree from "./pages/OtherPage/FiveZeroThree";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Pagination from "./pages/UiElements/Pagination";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import ButtonsGroup from "./pages/UiElements/ButtonsGroup";
import Notifications from "./pages/UiElements/Notifications";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import PieChart from "./pages/Charts/PieChart";
import RadarChart from "./pages/Charts/RadarChart";
import RadialChart from "./pages/Charts/RadialChart";
import Invoices from "./pages/Invoices";
import ComingSoon from "./pages/OtherPage/ComingSoon";
import FileManager from "./pages/FileManager";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import DataTables from "./pages/Tables/DataTables";
import PricingTables from "./pages/PricingTables";
import Faqs from "./pages/Faqs";
import Chats from "./pages/Chat/Chats";
import FormElements from "./pages/Forms/FormElements";
import FormLayout from "./pages/Forms/FormLayout";
import Blank from "./pages/Blank";
import EmailInbox from "./pages/Email/EmailInbox";
import EmailDetails from "./pages/Email/EmailDetails";
import TaskKanban from "./pages/Task/TaskKanban";
import BreadCrumb from "./pages/UiElements/BreadCrumb";
import Cards from "./pages/UiElements/Cards";
import Dropdowns from "./pages/UiElements/Dropdowns";
import Links from "./pages/UiElements/Links";
import Lists from "./pages/UiElements/Lists";
import Popovers from "./pages/UiElements/Popovers";
import Progressbar from "./pages/UiElements/Progressbar";
import Ribbons from "./pages/UiElements/Ribbons";
import Spinners from "./pages/UiElements/Spinners";
import Tabs from "./pages/UiElements/Tabs";
import Tooltips from "./pages/UiElements/Tooltips";
import Modals from "./pages/UiElements/Modals";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import TwoStepVerification from "./pages/AuthPages/TwoStepVerification";
import Success from "./pages/OtherPage/Success";
import AppLayout from "./layout/AppLayout";
import AlternativeLayout from "./layout/AlternativeLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import { GoToConnectProvider } from "./context/GoToConnectContext";
import CallToast from "./components/goToConnect/CallToast";
import TaskList from "./pages/Task/TaskList";
import Saas from "./pages/Dashboard/Saas";
import Logistics from "./pages/Dashboard/Logistics";
import VideoGeneratorPage from "./pages/Ai/Video/VideoGenerator";
import ProductList from "./pages/Ecommerce/ProductList";
import AddProduct from "./pages/Ecommerce/AddProduct";
import Billing from "./pages/Ecommerce/Billing";
import SingleInvoice from "./pages/Ecommerce/SingleInvoice";
import CreateInvoice from "./pages/Ecommerce/CreateInvoice";
import Transactions from "./pages/Ecommerce/Transactions";
import SingleTransaction from "./pages/Ecommerce/SingleTransaction";
import TicketList from "./pages/Support/TicketList";
import TicketReply from "./pages/Support/TicketReply";
import Integrations from "./pages/OtherPage/Integrations";
import ApiKeys from "./pages/OtherPage/ApiKeys";
import SalesDashboard from "./pages/Dashboard/Sales";
import AIDashboard from "./pages/Dashboard/AIDashboard";
import LayoutSix from "./pages/Layouts/LayoutSix";
import LayoutFive from "./pages/Layouts/LayoutFive";
import LayoutFour from "./pages/Layouts/LayoutFour";
import LayoutThree from "./pages/Layouts/LayoutThree";
import LayoutTwo from "./pages/Layouts/LayoutTwo";
import LayoutOne from "./pages/Layouts/LayoutOne";
import FinanceDashboard from "./pages/Dashboard/Finance";
import AiSettings from "./pages/Ai/AiSettings";
import Maps from "./pages/Maps/Maps";
import VectorMap from "./pages/Maps/VectorMap";
import TextGeneratorPage from "./pages/Ai/Text/TextGenerator";
import ImageGeneratorPage from "./pages/Ai/Image/ImageGenerator";
import CodeGeneratorPage from "./pages/Ai/Code/CodeGenerator";

export default function App() {
  return (
    <>
      <GoToConnectProvider>
      <Router>
        <ScrollToTop />
        <CallToast />
        <Routes>
          {/* Protected: Dashboard Layout */}
          <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index path="/" element={<CustomersList />} />
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/orders/:orderNumber" element={<OrderDetail />} />
            <Route path="/sms-logs" element={<SmsLogsList />} />
            <Route path="/sms-logs/:id" element={<SmsLogDetail />} />
            <Route path="/customers" element={<CustomersList />} />
            <Route path="/customers/detail" element={<CustomerDetail />} />
            <Route path="/tickets" element={<TicketsList />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/sms-templates" element={<SmsTemplatesList />} />
            <Route path="/email-templates" element={<EmailTemplatesList />} />
            <Route path="/cancellations" element={<CancellationsList />} />
            <Route path="/cancellations/:salesOrderId" element={<CancellationDetail />} />
            <Route path="/closure-methods" element={<ClosureMethodsList />} />
            <Route path="/contact-reasons" element={<ContactReasonsList />} />
            <Route path="/customer-contacts" element={<CustomerContactsList />} />
            <Route path="/customer-contacts/:orderId" element={<CustomerContactDetail />} />
            <Route path="/permissions" element={<PermissionsList />} />
            <Route path="/roles" element={<RolesList />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/crm" element={<Crm />} />
            <Route path="/stocks" element={<Stocks />} />
            <Route path="/saas" element={<Saas />} />
            <Route path="/logistics" element={<Logistics />} />
            <Route path="/sales" element={<SalesDashboard />} />
            <Route path="/ai" element={<AIDashboard />} />
            <Route path="/finance" element={<FinanceDashboard />} />

            <Route path="/calendar" element={<Calendar />} />
            <Route path="/invoice" element={<Invoices />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/chat" element={<Chats />} />
            <Route path="/file-manager" element={<FileManager />} />

            {/* E-commerce */}
            <Route path="/products-list" element={<ProductList />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/single-invoice" element={<SingleInvoice />} />
            <Route path="/create-invoice" element={<CreateInvoice />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/single-transaction" element={<SingleTransaction />} />

            {/* Support */}
            <Route path="/support-tickets" element={<TicketList />} />
            <Route path="/support-ticket-reply" element={<TicketReply />} />

            {/* Others Page */}
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/faq" element={<Faqs />} />
            <Route path="/pricing-tables" element={<PricingTables />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/api-keys" element={<ApiKeys />} />
            <Route path="/blank" element={<Blank />} />

            {/* Forms */}
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/form-layout" element={<FormLayout />} />

            {/* Applications */}
            <Route path="/task-list" element={<TaskList />} />
            <Route path="/task-kanban" element={<TaskKanban />} />

            {/* Email */}
            <Route path="/inbox" element={<EmailInbox />} />
            <Route path="/inbox-details" element={<EmailDetails />} />

            {/* Tables */}
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/data-tables" element={<DataTables />} />

            {/* Ui Elements */}
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/avatars" element={<Avatars />} />
            <Route path="/badge" element={<Badges />} />
            <Route path="/breadcrumb" element={<BreadCrumb />} />
            <Route path="/buttons" element={<Buttons />} />
            <Route path="/buttons-group" element={<ButtonsGroup />} />
            <Route path="/cards" element={<Cards />} />
            <Route path="/carousel" element={<Carousel />} />
            <Route path="/dropdowns" element={<Dropdowns />} />
            <Route path="/images" element={<Images />} />
            <Route path="/links" element={<Links />} />
            <Route path="/list" element={<Lists />} />
            <Route path="/modals" element={<Modals />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/pagination" element={<Pagination />} />
            <Route path="/popovers" element={<Popovers />} />
            <Route path="/progress-bar" element={<Progressbar />} />
            <Route path="/ribbons" element={<Ribbons />} />
            <Route path="/spinners" element={<Spinners />} />
            <Route path="/tabs" element={<Tabs />} />
            <Route path="/tooltips" element={<Tooltips />} />
            <Route path="/videos" element={<Videos />} />

            {/* Charts */}
            <Route path="/line-chart" element={<LineChart />} />
            <Route path="/bar-chart" element={<BarChart />} />
            <Route path="/pie-chart" element={<PieChart />} />
            <Route path="/radar-chart" element={<RadarChart />} />
            <Route path="/radial-chart" element={<RadialChart />} />

            {/* Maps */}
            <Route path="/maps" element={<Maps />} />
            <Route path="/vector-map" element={<VectorMap />} />
          </Route>
          </Route>

          {/* Protected: Alternative Layout */}
          <Route element={<ProtectedRoute />}>
          <Route element={<AlternativeLayout />}>
            {/* AI Generator */}
            <Route path="/text-generator" element={<TextGeneratorPage />} />
            <Route path="/image-generator" element={<ImageGeneratorPage />} />
            <Route path="/code-generator" element={<CodeGeneratorPage />} />
            <Route path="/video-generator" element={<VideoGeneratorPage />} />
            <Route path="/ai-settings" element={<AiSettings />} />
          </Route>
          </Route>

          {/* Auth Layout */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/two-step-verification"
            element={<TwoStepVerification />}
          />
          <Route path="/atc-signin" element={<AtcSignIn />} />

          {/* Layouts */}
          <Route path="/layout-one" element={<LayoutOne />} />
          <Route path="/layout-two" element={<LayoutTwo />} />
          <Route path="/layout-three" element={<LayoutThree />} />
          <Route path="/layout-four" element={<LayoutFour />} />
          <Route path="/layout-five" element={<LayoutFive />} />
          <Route path="/layout-six" element={<LayoutSix />} />

          {/* Fallback Route */}
          <Route path="*" element={<NotFound />} />
          <Route path="/maintenance" element={<Maintenance />} />
          <Route path="/success" element={<Success />} />
          <Route path="/five-zero-zero" element={<FiveZeroZero />} />
          <Route path="/five-zero-three" element={<FiveZeroThree />} />
          <Route path="/coming-soon" element={<ComingSoon />} />
        </Routes>
      </Router>
      </GoToConnectProvider>
    </>
  );
}
