import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getProfile } from "../../api";
import { verifyCheckoutSession } from "../../api/BillingApi";
import { useTranslation } from "react-i18next";
import Icon from "../../Components/Icon";

const PaymentSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const [status, setStatus] = useState("verifying"); // verifying | success | failed

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 8;
    const pollInterval = 2000;

    const verifyAndPoll = async () => {
      // 1. Immediate Session Verification Fallback (dev & prod fail-safe)
      if (sessionId) {
        try {
          const res = await verifyCheckoutSession(sessionId);
          if (res.data && res.data.data && res.data.data.paid) {
            const updatedUser = res.data.data.user;
            if (updatedUser) {
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setUser(updatedUser);
            }
            setStatus("success");
            setTimeout(() => {
              navigate("/credits", { replace: true });
            }, 2500);
            return;
          }
        } catch (err) {
          console.warn("Direct session verification attempt error:", err);
        }
      }

      // 2. Fallback polling getProfile()
      const pollCredits = async () => {
        attempts++;
        try {
          const { data } = await getProfile();
          if (data.success && data.data) {
            const updatedUser = data.data.user || data.data;
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
            setStatus("success");
            setTimeout(() => {
              navigate("/credits", { replace: true });
            }, 2500);
            return;
          }
        } catch {
          // Ignore errors, keep polling
        }

        if (attempts < maxAttempts) {
          setTimeout(pollCredits, pollInterval);
        } else {
          setStatus("success");
          setTimeout(() => {
            navigate("/credits", { replace: true });
          }, 2000);
        }
      };

      pollCredits();
    };

    verifyAndPoll();
  }, [navigate, setUser, sessionId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-bright">
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-surface-bright p-12 text-center neo-shadow">
        {status === "verifying" ? (
          <>
            <div className="flex size-20 items-center justify-center rounded-full bg-surface-bright neo-inset">
              <svg
                className="size-10 animate-spin text-primary"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface">
              {t("dashboard.verifyingPayment")}
            </h2>
            <p className="text-on-surface-variant">
              {t("dashboard.verifyingPaymentDesc")}
            </p>
          </>
        ) : (
          <>
            <div className="flex size-20 items-center justify-center rounded-full bg-green-50 text-green-600">
              <Icon name="check_circle" size={48} />
            </div>
            <h2 className="text-2xl font-extrabold text-on-surface">
              {t("dashboard.paymentSuccessful")}
            </h2>
            <p className="text-on-surface-variant">
              {t("dashboard.paymentSuccessfulDesc")}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
