import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense, type ComponentProps, type ComponentType } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const PickerLazy = lazy(() => import("./LeafletMaps").then((m) => ({ default: m.MapPickerInner })));
const ViewLazy = lazy(() => import("./LeafletMaps").then((m) => ({ default: m.MapViewInner })));
const ReportsLazy = lazy(() => import("./LeafletMaps").then((m) => ({ default: m.ReportsMapInner })));

const Fallback = () => <Skeleton className="h-full w-full rounded-none" />;

function wrap<P extends object>(C: ComponentType<P>) {
  return function Wrapped(props: P) {
    return (
      <ClientOnly fallback={<Fallback />}>
        <Suspense fallback={<Fallback />}><C {...props} /></Suspense>
      </ClientOnly>
    );
  };
}

type Inner = typeof import("./LeafletMaps");
export const MapPicker = wrap(PickerLazy as unknown as ComponentType<ComponentProps<Inner["MapPickerInner"]>>);
export const MapView = wrap(ViewLazy as unknown as ComponentType<ComponentProps<Inner["MapViewInner"]>>);
export const ReportsMap = wrap(ReportsLazy as unknown as ComponentType<ComponentProps<Inner["ReportsMapInner"]>>);
