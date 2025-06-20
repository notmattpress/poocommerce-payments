/**
 * External dependencies
 */
import React, { useEffect, useRef, useState, memo } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { debounce, noop } from 'lodash';

/**
 * Internal dependencies
 */
import './style.scss';

const defaultParentElement =
	document.getElementById( 'wpbody-content' ) || document.body;

const isEventTriggeredWithin = (
	event: MouseEvent,
	element?: ChildNode | null
) => {
	if ( ! element ) {
		return false;
	}
	if ( element === event.target ) {
		return true;
	}
	if ( event.target instanceof Node && element.contains( event.target ) ) {
		return true;
	}
	return false;
};

type UseHideDelayProps = {
	hideDelayMs?: number;
	triggerRef: React.RefObject< HTMLElement >;
	tooltipRef: React.RefObject< HTMLElement >;
	parentElement: HTMLElement;
	onHide?: () => void;
};
const useHideDelay = (
	isVisibleProp: boolean,
	{
		hideDelayMs = 600,
		triggerRef,
		tooltipRef,
		parentElement,
		onHide = noop,
	}: UseHideDelayProps
) => {
	const [ isVisible, setIsVisible ] = useState( isVisibleProp );
	// not using state for this, we don't need to cause a re-render
	const hasMountedRef = useRef( false );
	const onHideCallbackRef = useRef( onHide );

	useEffect( () => {
		onHideCallbackRef.current = onHide;
	}, [ onHide ] );

	// hide delay
	useEffect( () => {
		let timer: ReturnType< typeof setTimeout > | null = null;

		if ( ! hasMountedRef.current ) {
			hasMountedRef.current = true;
			return;
		}

		// element is marked as visible, no need to hide it
		if ( isVisibleProp ) {
			parentElement.dispatchEvent( new Event( 'wcpay-tooltip-open' ) );
			setIsVisible( true );
			return;
		}

		if ( ! isVisible ) {
			return;
		}

		// element is marked as not visible, hide it after `hideDelayMs` milliseconds
		timer = setTimeout( () => {
			setIsVisible( false );
			onHideCallbackRef.current();
		}, hideDelayMs );

		return () => {
			if ( timer ) {
				clearTimeout( timer );
			}
		};
	}, [ setIsVisible, hideDelayMs, isVisibleProp, isVisible, parentElement ] );

	// listen to other events to hide
	useEffect( () => {
		if ( ! isVisible ) return;

		// immediately hide this tooltip if another one opens
		const handleHideElement = () => {
			setIsVisible( false );
			onHideCallbackRef.current();
		};

		// do not hide the tooltip if a click event has occurred and the click happened within the tooltip or within the wrapped element
		const handleDocumentClick = ( event: MouseEvent ) => {
			if (
				isEventTriggeredWithin(
					event,
					triggerRef.current?.firstChild
				) ||
				isEventTriggeredWithin( event, tooltipRef.current )
			) {
				return;
			}

			setIsVisible( false );
			onHideCallbackRef.current();
		};

		document.addEventListener( 'click', handleDocumentClick );
		parentElement.addEventListener(
			'wcpay-tooltip-open',
			handleHideElement
		);

		return () => {
			document.removeEventListener( 'click', handleDocumentClick );
			parentElement.removeEventListener(
				'wcpay-tooltip-open',
				handleHideElement
			);
		};
	}, [ isVisibleProp, isVisible, triggerRef, tooltipRef, parentElement ] );

	return isVisible;
};

type TooltipPortalProps = {
	children: React.ReactNode;
	parentElement: HTMLElement;
};

const TooltipPortal: React.FC< React.PropsWithChildren<
	TooltipPortalProps
> > = memo( ( { children, parentElement } ) => {
	const node = useRef< HTMLElement | null >( null );
	if ( ! node.current ) {
		node.current = document.createElement( 'div' );
		parentElement.appendChild( node.current );
	}

	// on component unmount, clear any reference to the created node
	useEffect( () => {
		return () => {
			if ( node.current ) {
				parentElement.removeChild( node.current );
				node.current = null;
			}
		};
	}, [ parentElement ] );

	return createPortal( children, node.current );
} );

export type TooltipBaseProps = {
	className?: string;
	children?: React.ReactNode;
	content: React.ReactNode;
	parentElement?: HTMLElement;
	hideDelayMs?: number;
	isVisible?: boolean;
	onHide?: () => void;
	maxWidth?: string;
};

const TooltipBase: React.FC< React.PropsWithChildren< TooltipBaseProps > > = ( {
	className,
	children,
	content,
	parentElement = defaultParentElement,
	hideDelayMs = 600,
	isVisible,
	onHide,
	maxWidth = '250px',
} ) => {
	const wrapperRef = useRef< HTMLDivElement >( null );
	const tooltipWrapperRef = useRef< HTMLDivElement >( null );

	// using a delayed hide, to allow the fade-out animation to complete
	const isTooltipVisible = useHideDelay( !! isVisible, {
		hideDelayMs,
		triggerRef: wrapperRef,
		tooltipRef: tooltipWrapperRef,
		parentElement,
		onHide,
	} );

	useEffect( () => {
		const calculateTooltipPosition = () => {
			// calculate the position of the tooltip based on the wrapper's bounding rect
			if ( ! isTooltipVisible ) {
				return;
			}

			const tooltipElement = tooltipWrapperRef.current;
			const wrappedElement = wrapperRef.current?.firstChild;
			if ( ! tooltipElement || ! wrappedElement ) {
				return;
			}

			if ( ! ( wrappedElement instanceof HTMLElement ) ) {
				return;
			}

			tooltipElement.style.maxWidth = maxWidth;

			const wrappedElementRect = wrappedElement.getBoundingClientRect();
			const tooltipElementRect = tooltipElement.getBoundingClientRect();

			const tooltipHeight = tooltipElementRect.height;
			tooltipElement.style.top = `${
				wrappedElementRect.top - tooltipHeight - 8
			}px`;
			const elementMiddle =
				wrappedElement.offsetWidth / 2 + wrappedElementRect.left;
			const tooltipWidth = tooltipElement.offsetWidth;
			let tooltipLeft = elementMiddle - tooltipWidth / 2;
			const tooltipRight =
				window.innerWidth -
				( wrappedElementRect.left + tooltipElement.offsetWidth );

			if ( tooltipLeft < 0 ) {
				// create a gap with the left edge if the element is out of view port
				tooltipLeft = 45;
			} else if ( tooltipRight < 0 ) {
				// create a gap with the right edge if the element is out of view port
				tooltipLeft = tooltipLeft - 85;
			}

			tooltipElement.style.left = `${ tooltipLeft }px`;

			// make it visible only after all the calculations are done.
			tooltipElement.style.visibility = 'visible';
			tooltipElement.style.opacity = '1';
		};

		calculateTooltipPosition();

		const debouncedCalculation = debounce( calculateTooltipPosition, 150 );

		window.addEventListener( 'resize', debouncedCalculation );
		document.addEventListener( 'scroll', debouncedCalculation );

		return () => {
			window.removeEventListener( 'resize', debouncedCalculation );
			document.removeEventListener( 'scroll', debouncedCalculation );
		};
	}, [ isTooltipVisible, maxWidth ] );

	return (
		<>
			<div className="wcpay-tooltip__content-wrapper" ref={ wrapperRef }>
				{ children }
			</div>
			{ isTooltipVisible && (
				<TooltipPortal parentElement={ parentElement }>
					<div
						ref={ tooltipWrapperRef }
						className={ clsx( 'wcpay-tooltip__tooltip-wrapper', {
							'is-hiding': ! isVisible,
						} ) }
						role="tooltip"
					>
						<div
							className={ clsx(
								'wcpay-tooltip__tooltip',
								className
							) }
						>
							{ content }
						</div>
					</div>
				</TooltipPortal>
			) }
		</>
	);
};

export default TooltipBase;
