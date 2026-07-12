import { Link } from "react-router-dom";
import Icon from "../../Components/Icon";

const priceFormat = (amount) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(amount);

const dateFormat = (date) =>
  new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "2-digit" }).format(date);

const offers = [
  { icon: "token", title: "Basic Boost", credits: "500", bonus: "+100 FREE Credits", price: 29 },
  { icon: "database", title: "Growth Pack", credits: "2000", bonus: "+500 FREE Credits", price: 99, best: true },
  { icon: "diamond", title: "Master Volume", credits: "5000", bonus: "+1700 FREE Credits", price: 199 },
];

const transactions = [
  { title: "Growth Pack Top-up", id: "82194", date: new Date("2024-12-01"), amount: 99, credits: "2,500 Credits added" },
  { title: "Subscription Renewal (Plus)", id: "77231", date: new Date("2024-11-12"), amount: 49, credits: "500 Credits added" },
];

const resetDate = new Date("2025-01-12");

const Credits = () => {
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
            <p className="mb-2 text-sm font-medium text-on-surface-variant">Available Credits</p>
            <div className="mb-4 text-3xl font-extrabold tracking-tight text-primary">
              420 <span className="text-sm font-semibold text-on-surface-variant">/ 500</span>
            </div>
            <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-surface-bright neo-inset">
              <div className="h-full w-[84%] rounded-full bg-primary shadow-[0_0_8px_rgba(140,98,57,0.5)]" />
            </div>
            <p className="text-[11px] font-medium text-on-surface-variant opacity-80">Next reset on {dateFormat(resetDate)}</p>
          </div>
        </aside>

        <section className="flex flex-1 flex-col gap-10">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight text-on-surface">Billing & Credits</h2>
            <p className="text-lg text-on-surface-variant">
              Manage your subscription tiers and manage your operational budget.
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
                  <h4 className="mb-2 text-lg font-bold text-on-surface">{offer.title}</h4>
                  <div className="mb-2 text-3xl font-extrabold text-on-surface">
                    {offer.credits}
                    <span className="ml-1 text-lg font-bold text-on-surface-variant">Credits</span>
                  </div>
                  <div className="mb-8 text-sm font-bold text-tertiary">{offer.bonus}</div>
                  <div className="mt-auto w-full">
                    <button className="w-full rounded-2xl bg-surface-bright py-4 font-bold text-primary transition-all neo-shadow neo-button">
                      {priceFormat(offer.price)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-3xl bg-surface-bright p-8 neo-shadow">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-on-surface">Recent Transactions</h3>
              <button className="text-sm font-semibold text-primary hover:underline">View All</button>
            </div>
            <div className="space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between rounded-2xl bg-surface-bright p-5 neo-inset">
                  <div className="flex items-center gap-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-surface-bright text-on-surface-variant neo-shadow">
                      <Icon name="history" size={14} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-on-surface">{tx.title}</p>
                      <p className="mt-1 text-[11px] font-medium text-on-surface-variant">
                        {dateFormat(tx.date)} &bull; ID: {tx.id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-primary">+{priceFormat(tx.amount)}</p>
                    <p className="mt-1 text-[11px] font-medium text-on-surface-variant">{tx.credits}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Credits;
