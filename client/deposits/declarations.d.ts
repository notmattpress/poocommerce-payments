/**
 * The types for the `@poocommerce/components` package are being declared here
 * because it does not have its own types (as of version 5.1.2).
 * We should remove this file once we've updated to a version of `@poocommerce/components` with type defs.
 */
declare module '@poocommerce/components' {
	const SummaryListPlaceholder: ( props: {
		numberOfItems: number;
	} ) => JSX.Element;

	const SummaryList: ( props: {
		label: string;
		children?: () => any;
	} ) => JSX.Element;

	const OrderStatus: ( {
		order: { status },
		className,
		orderStatusMap,
		labelPositionToLeft,
	}: {
		order: {
			status: string;
		};
		className?: string;
		// eslint-disable-next-line @typescript-eslint/ban-types
		orderStatusMap: Object;
		labelPositionToLeft?: boolean;
	} ) => JSX.Element;

	type LinkParams = {
		href: string;
		children?: React.ReactNode;
		type?: string;
		tabIndex?: string;
		target?: string;
		rel?: string;
		onClick?: ( ...props: any ) => any;
		className?: string;
	};
	const Link: ( props: LinkParams ) => JSX.Element;

	interface TourKitStep {
		slug?: string;
		referenceElements?: {
			desktop?: string;
			mobile?: string;
		};
		meta: {
			[ key: string ]: unknown;
		};
		options?: {
			classNames?: {
				desktop?: string | string[];
				mobile?: string | string[];
			};
		};
	}

	interface PillProps {
		className: string;
	}

	const Pill: React.FC< React.PropsWithChildren< PillProps > >;

	interface TourKitOptions {
		classNames?: string | string[];
		callbacks?: unknown;
		effects?: {
			spotlight?: {
				interactivity?: unknown;
				styles?: React.CSSProperties;
			};
			arrowIndicator?: boolean;
			overlay?: boolean;
			autoScroll?: ScrollIntoViewOptions | boolean;
			liveResize?: unknown;
		};
		popperModifiers?: unknown[];
		portalParentElement?: HTMLElement | null;
	}

	interface TourKitProps {
		config: {
			steps: TourKitStep[];
			options?: {
				effects: {
					overlay: boolean;
					autoScroll: ScrollIntoViewOptions;
				};
			};
			placement?: 'top';
			closeHandler: () => void;
		};
	}

	const TourKit: ( props: any ) => JSX.Element;

	interface ListProps {
		className?: string;
		items: any[];
	}

	const List: React.FC< React.PropsWithChildren< ListProps > >;
}
