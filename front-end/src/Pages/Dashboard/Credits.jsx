import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createCheckout, getPaymentHistory } from "../../api";
import Icon from "../../Components/Icon";

const priceFormat = (amountPiasters) =>
  new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 2,
  }).format(amountPiasters / 100);

const dateFormat = (date) =>
  new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(new Date(date));

const offers = [
  {
    icon: "token",
    title: "Basic Boost",
    credits: 500,
    creditsLabel: "500",
    bonus: null,
    price: 37500,
    tier: 500,
  },
  {
    icon: "database",
    title: "Growth Pack",
    credits: 2000,
    creditsLabel: "2,000",
    bonus: "+300 FREE Credits",
    price: 150000,
    tier: 2000,
    best: true,
  },
  {
    icon: "diamond",
    title: "Master Volume",
    credits: 5000,
    creditsLabel: "5,000",
    bonus: "+1,000 FREE Credits",
    price: 375000,
    tier: 5000,
  },
];

const Credits = () => {
  const { user, setUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loadingTier, setLoadingTier] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await getPaymentHistory();
        if (data.success) {
          setTransactions(data.data.payments || []);
        }
      } catch {
        // Silently fail — history section will show empty
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleCheckout = async (tier) => {
    if (loadingTier) return;
    setLoadingTier(tier);
    try {
      const { data } = await createCheckout(tier);
      if (data.success && data.data?.checkoutUrl) {
        window.location.href = data.data.checkoutUrl;
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      setLoadingTier(null);
    }
  };

  const userCredits = user?.credits ?? 0;

  return (
    <div className="flex min-h-screen flex-col bg-surface-bright text-on-surface font-body">
      <main className="mx-auto flex w-full max-w-[1200px] flex-grow flex-col gap-8 px-6 py-10 md:flex-row md:px-20">
        <aside className="flex w-full flex-col gap-8 md:w-64">
          <div className="flex flex-col gap-2 rounded-3xl bg-surface-bright p-4 neo-shadow">
            <Link
              className="flex items-center gap-3 rounded-2xl px-4 py-3 text-on-surface-variant transition-all hover:bg-surface-container-low neo-button"
              to="/profile"
            >
              <Icon name="person" />
              <span className="font-medium">Profile</span>
            </Link>
            <Link
              className="flex items-center gap-3 rounded-2xl bg-surface-bright px-4 py-3 font-semibold text-primary neo-inset"
              to="/credits"
            >
              <Icon name="payments" />
              <span className="font-medium">Billing</span>
            </Link>
          </div>
          <div className="rounded-3xl bg-surface-bright p-6 neo-shadow">
            <p className="mb-2 text-sm font-medium text-on-surface-variant">
              Available Credits
            </p>
            <div className="mb-4 text-3xl font-extrabold tracking-tight text-primary">
              {userCredits.toLocaleString()}
            </div>
            <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-surface-bright neo-inset">
              <div
                className="h-full rounded-full bg-primary shadow-[0_0_8px_rgba(140,98,57,0.5)] transition-all duration-500"
                style={{ width: `${Math.min((userCredits / 6000) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[11px] font-medium text-on-surface-variant opacity-80">
              Top up anytime to keep generating
            </p>
          </div>
        </aside>

        <section className="flex flex-1 flex-col gap-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">
              Billing & Credits
            </h2>
            <p className="text-lg text-on-surface-variant">
              Manage your credits and top up to keep generating designs.
            </p>
          </div>

          <div className="mt-8">
            <h2 className="mb-8 flex items-center gap-3 text-2xl font-bold text-on-surface">
              <Icon name="add_circle" className="text-primary" />
              Top Up Credits
            </h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {offers.map((offer) => (
                <div
                  key={offer.title}
                  className={`group relative flex flex-col items-center overflow-hidden rounded-3xl bg-surface-bright p-8 text-center transition-transform duration-300 hover:scale-[1.02] neo-shadow ${
                    offer.best ? "border-2 border-primary/20" : ""
                  }`}
                >
                  {offer.best ? (
                    <div className="absolute right-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold tracking-wider text-white shadow-sm">
                      BEST VALUE
                    </div>
                  ) : null}
                  <div className="mb-6 flex size-16 items-center justify-center rounded-2xl text-primary neo-inset">
                    <Icon name={offer.icon} size={32} />
                  </div>
                  <h4 className="mb-2 text-lg font-bold text-on-surface">
                    {offer.title}
                  </h4>
                  <div className="mb-2 text-3xl font-extrabold text-on-surface">
                    {offer.creditsLabel}
                    <span className="ml-1 text-lg font-bold text-on-surface-variant">
                      Credits
                    </span>
                  </div>
                  {offer.bonus ? (
                    <div className="mb-8 text-sm font-bold text-tertiary">
                      {offer.bonus}
                    </div>
                  ) : (
                    <div className="mb-8" />
                  )}
                  <div className="mt-auto w-full">
                    <button
                      onClick={() => handleCheckout(offer.tier)}
                      disabled={loadingTier !== null}
                      className="w-full rounded-2xl bg-surface-bright py-4 font-bold text-primary transition-all neo-shadow neo-button disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingTier === offer.tier ? (
                        <span className="inline-flex items-center gap-2">
                          <svg
                            className="size-5 animate-spin"
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
                          Redirecting…
                        </span>
                      ) : (
                        priceFormat(offer.price)
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-surface-bright p-8 neo-shadow">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-on-surface">
                Recent Transactions
              </h3>
            </div>
            <div className="space-y-4">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <svg
                    className="size-8 animate-spin text-primary"
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
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl bg-surface-bright p-8 neo-inset">
                  <Icon
                    name="receipt_long"
                    size={32}
                    className="mb-3 text-on-surface-variant opacity-50"
                  />
                  <p className="text-sm font-medium text-on-surface-variant">
                    No transactions yet
                  </p>
                </div>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between rounded-2xl bg-surface-bright p-5 neo-inset"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-surface-bright text-on-surface-variant neo-shadow">
                        <Icon name="check_circle" size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">
                          Credit Top-up
                        </p>
                        <p className="mt-1 text-[11px] font-medium text-on-surface-variant">
                          {dateFormat(tx.completedAt || tx.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-primary">
                        {priceFormat(tx.amountPaid)}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-on-surface-variant">
                        +{tx.creditsAdded.toLocaleString()} Credits
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Credits;
