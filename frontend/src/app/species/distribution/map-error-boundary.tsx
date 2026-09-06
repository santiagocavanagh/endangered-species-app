import { Component, type ReactNode } from "react";

interface MapErrorBoundaryProps {
  children: ReactNode;
}

interface MapErrorBoundaryState {
  hasError: boolean;
}

// Aísla fallos de Leaflet/plugins de terceros: un error en el mapa ya no debe tumbar toda la app.
export class MapErrorBoundary extends Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown): void {
    console.error("Error al renderizar el mapa de distribución:", error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gray-50 text-center p-4">
          <p className="text-sm text-gray-500">
            No se pudo cargar el mapa de distribución.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
