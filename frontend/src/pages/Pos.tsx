import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { productsApi, type Product } from "@/api/products";
import { servicesApi, type Service } from "@/api/services";
import { salesApi, type CreateSalePayload } from "@/api/sales";
import { settingsApi } from "@/api/settings";
import { usePosStore, type CartItem, type ProductCartItem, type ServiceCartItem } from "@/store/posStore";
import { money } from "@/lib/format";
import { printTicket } from "@/lib/pos-ticket";
import { type PaymentMethod } from "@/lib/constants";
import { PosSearchBar, type SearchResult } from "@/components/pages/pos/PosSearchBar";
import { PosCartTable } from "@/components/pages/pos/PosCartTable";
import { PosPaymentPanel } from "@/components/pages/pos/PosPaymentPanel";
import { PosCompletedSaleModal } from "@/components/pages/pos/PosCompletedSaleModal";
import { PosDialog } from "@/components/pages/pos/PosDialog";
import styles from "./Pos.module.css";

export default function Pos() {
  const scanRef = useRef<HTMLInputElement>(null);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const [scan, setScan] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [storeName, setStoreName] = useState("");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeFooter, setStoreFooter] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [addingToService, setAddingToService] = useState<string | null>(null);
  const [serviceProductSearch, setServiceProductSearch] = useState("");
  const [completedSale, setCompletedSale] = useState<{
    saleId: string;
    cart: CartItem[];
    totals: { subtotal: number; tax: number; discount: number; total: number; change: number };
    payment: string;
    received: string;
    discountPct: number;
  } | null>(null);

  const [dialog, setDialog] = useState<{
    message: string;
    variant: "alert" | "confirm";
    onConfirm?: () => void;
  } | null>(null);

  const showAlert = useCallback((message: string) => setDialog({ message, variant: "alert" }), []);
  const showConfirm = useCallback((message: string, onConfirm: () => void) => setDialog({ message, variant: "confirm", onConfirm }), []);

  const cart = usePosStore((s) => s.cart);
  const discountPct = usePosStore((s) => s.discountPct);
  const payment = usePosStore((s) => s.payment);
  const received = usePosStore((s) => s.received);
  const manualAmount = usePosStore((s) => s.manualAmount);
  const checkingOut = usePosStore((s) => s.checkingOut);
  const currency = usePosStore((s) => s.currency);
  const setQty = usePosStore((s) => s.setQty);
  const clearCart = usePosStore((s) => s.clearCart);
  const setDiscountPct = usePosStore((s) => s.setDiscountPct);
  const setPayment = usePosStore((s) => s.setPayment);
  const setReceived = usePosStore((s) => s.setReceived);
  const setManualAmount = usePosStore((s) => s.setManualAmount);
  const setCheckingOut = usePosStore((s) => s.setCheckingOut);
  const addServiceProduct = usePosStore((s) => s.addServiceProduct);

  useEffect(() => {
    productsApi.list({ active: true, limit: 100 })
      .then((res) => setProducts(res.products))
      .catch((err) => console.warn("Error al cargar productos:", err));

    servicesApi.list({ active: true, limit: 100 })
      .then((res) => setServices(res.services))
      .catch((err) => console.warn("Error al cargar servicios:", err));

    settingsApi.get()
      .then((res) => {
        setStoreName(res.name);
        setStoreAddress(res.address ?? "");
        setStorePhone(res.phone ?? "");
        setStoreFooter(res.ticket_footer ?? "");
      })
      .catch((err) => console.warn("Error al cargar config:", err));
  }, []);

  useEffect(() => { scanRef.current?.focus(); }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchResults = useMemo(() => {
    const term = scan.trim().toLowerCase();
    if (!term) return [];
    const results: SearchResult[] = [];

    for (const p of products) {
      if (!p.active) continue;
      if (
        (p.barcode && p.barcode.toLowerCase().includes(term)) ||
        p.name.toLowerCase().includes(term)
      ) {
        results.push({ _type: "product", id: p.id, name: p.name, barcode: p.barcode, price: p.price, data: p });
        if (results.length >= 15) break;
      }
    }

    if (results.length < 15) {
      for (const s of services) {
        if (!s.is_active) continue;
        if (s.name.toLowerCase().includes(term)) {
          results.push({ _type: "service", id: s.id, name: s.name, barcode: undefined, price: s.base_price, data: s });
          if (results.length >= 15) break;
        }
      }
    }

    return results;
  }, [scan, products, services]);

  function addToCart(result: SearchResult) {
    if (result._type === "product") {
      const product = result.data as Product;
      if (product.stock <= 0) {
        showAlert(`"${product.name}" no tiene stock disponible`);
        return;
      }
      const inCart = cart.find((x) => x._type === "product" && x.id === product.id) as ProductCartItem | undefined;
      const newTotalQty = (inCart?.quantity ?? 0) + 1;
      if (newTotalQty > product.stock) {
        showAlert(`Stock insuficiente para "${product.name}": disponible ${product.stock}, ya tienes ${inCart?.quantity ?? 0} en el carrito`);
        return;
      }
      if (product.stock <= product.low_stock_threshold) {
        showConfirm(`"${product.name}" tiene stock bajo (${product.stock} unidades). ¿Agregar al carrito de todas formas?`, () => {
          usePosStore.getState().addToCart(product);
          setScan("");
          setShowResults(false);
          scanRef.current?.focus();
        });
        return;
      }
      usePosStore.getState().addToCart(product);
    } else {
      const service = result.data as Service;
      usePosStore.getState().addToCart({
        id: service.id,
        service_id: service.id,
        name: service.name,
        base_price: service.base_price,
        products: service.products,
      });
    }
    setScan("");
    setShowResults(false);
    scanRef.current?.focus();
  }

  function handleSetQty(item: CartItem, newQty: number) {
    if (item._type === "product" && newQty > item.quantity) {
      const prod = item as ProductCartItem;
      if (prod.stock <= 0) {
        showAlert(`"${prod.name}" no tiene stock disponible`);
        return;
      }
      if (newQty > prod.stock) {
        showAlert(`Stock insuficiente para "${prod.name}": disponible ${prod.stock}, solicitado ${newQty}`);
        return;
      }
    }
    setQty(item.id, newQty);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const term = scan.trim();
    if (!term) return;
    if (searchResults.length > 0) {
      addToCart(searchResults[0]);
      return;
    }
  }

  const totals = useMemo(() => {
    const subtotal = cart.reduce((s, x) => {
      if (x._type === "product") return s + x.price * x.quantity;
      const svc = x as ServiceCartItem;
      const additivePerInstance = svc.products
        .filter((sp) => sp.affects_price)
        .reduce((sum, sp) => sum + sp.unit_price * sp.quantity, 0);
      return s + (svc.base_price + additivePerInstance) * svc.quantity;
    }, 0);
    const tax = 0;
    const discount = subtotal * (discountPct / 100);
    const total = subtotal - discount;
    const change = (payment === "efectivo" || manualAmount) && received ? Math.max(0, Number(received) - total) : 0;
    return { subtotal, tax, discount, total, change };
  }, [cart, discountPct, payment, received]);

  async function checkout() {
    if (!cart.length || checkingOut) return;

    if ((payment === "efectivo" || manualAmount) && Number(received || 0) < totals.total) {
      showAlert(`El monto recibido (${money(Number(received || 0), currency)}) es menor al total (${money(totals.total, currency)}).`);
      setCheckingOut(false);
      return;
    }

    setCheckingOut(true);

    try {
      const items = cart
        .filter((x): x is ProductCartItem => x._type === "product")
        .map((item) => ({
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          tax_rate: 0,
          line_total: item.price * item.quantity,
        }));

      const serviceItems = cart
        .filter((x): x is ServiceCartItem => x._type === "service")
        .map((item) => {
          const svcQty = item.quantity;
          const customProducts = item.products.map((sp) => ({
            product_id: sp.product_id,
            product_name: sp.product_name,
            quantity: sp.quantity * svcQty,
            unit_price: sp.unit_price,
            line_total: sp.unit_price * sp.quantity * svcQty,
            affects_price: sp.affects_price,
          }));
          const additiveTotal = customProducts
            .filter((p) => p.affects_price)
            .reduce((s, p) => s + p.line_total, 0);
          return {
            service_id: item.service_id,
            service_name: item.name,
            base_price: item.base_price,
            line_total: item.base_price * svcQty + additiveTotal,
            products: customProducts,
          };
        });

      const shouldSendAmount = payment === "efectivo" || manualAmount;

      const payload: CreateSalePayload = {
        subtotal: totals.subtotal,
        tax_total: 0,
        discount: totals.discount,
        total: totals.total,
        payment_method: payment as PaymentMethod,
        amount_received: shouldSendAmount ? Number(received || 0) : undefined,
        change_given: shouldSendAmount ? totals.change : undefined,
        items: items.length > 0 ? items : undefined,
        service_items: serviceItems.length > 0 ? serviceItems : undefined,
      };

      const sale = await salesApi.create(payload);
      setCompletedSale({
        saleId: sale.id,
        cart: [...cart],
        totals: { ...totals },
        payment,
        received,
        discountPct,
      });
    } catch (err) {
      console.error("Error al crear venta:", err);
      showAlert("Error al procesar la venta. Intenta de nuevo.");
      setCheckingOut(false);
    }
  }

  function handlePrintTicket(saleId: string) {
    if (!completedSale) return;
    printTicket(saleId, completedSale.cart, completedSale.totals, completedSale.payment, completedSale.received, storeName, storeAddress, storePhone, storeFooter, completedSale.discountPct);
    finalizeSale();
  }

  function finalizeSale() {
    setCompletedSale(null);
    clearCart();
    setCheckingOut(false);
    scanRef.current?.focus();
  }



  return (
    <div className={styles.grid}>
      <div className={styles.leftPanel}>
        <PosSearchBar
          searchTerm={scan}
          showResults={showResults}
          searchResults={searchResults}
          searchWrapperRef={searchWrapperRef}
          inputRef={scanRef}
          onSearchChange={(v) => { setScan(v); setShowResults(true); }}
          onFocus={() => { if (scan.trim()) setShowResults(true); }}
          onKeyDown={(e) => { if (e.key === "Escape") setShowResults(false); }}
          onSubmit={handleSubmit}
          onAddToCart={addToCart}
        />

        <div className={styles.cartArea}>
          <PosCartTable
            cart={cart}
            products={products}
            addingToService={addingToService}
            serviceProductSearch={serviceProductSearch}
            onSetQty={handleSetQty}
            onDelete={(id) => setQty(id, 0)}
            onAddingToService={setAddingToService}
            onServiceProductSearch={setServiceProductSearch}
            onAddServiceProduct={addServiceProduct}
            showAlert={showAlert}
          />
        </div>
      </div>

      <div className={styles.rightPanel}>
        <PosPaymentPanel
          totals={totals}
          cartLength={cart.length}
          discountPct={discountPct}
          payment={payment}
          received={received}
          manualAmount={manualAmount}
          checkingOut={checkingOut}
          onDiscountPct={setDiscountPct}
          onPayment={setPayment}
          onReceived={setReceived}
          onManualAmount={setManualAmount}
          onCheckout={checkout}
          onClearCart={clearCart}
        />
      </div>

      {completedSale && (
        <PosCompletedSaleModal
          completedSale={completedSale}
          storeName={storeName}
          storeAddress={storeAddress}
          storePhone={storePhone}
          storeFooter={storeFooter}
          onPrint={handlePrintTicket}
          onClose={finalizeSale}
        />
      )}

      <PosDialog dialog={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}


