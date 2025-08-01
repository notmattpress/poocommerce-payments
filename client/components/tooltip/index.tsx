/**
 * External dependencies
 */
import React, { useState, useRef } from 'react';
import clsx from 'clsx';
import { noop } from 'lodash';
// eslint-disable-next-line no-restricted-syntax
import type { Icon as IconType } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Icon } from 'wcpay/components/wp-components-wrapped/components/icon';
import TooltipBase, { TooltipBaseProps } from './tooltip-base';

type TooltipProps = TooltipBaseProps & {
	isVisible?: boolean;
	onHide?: () => void;
	/**
	 * An icon that will be used as the tooltip button. Replaces the component children.
	 */
	buttonIcon?: IconType.IconType< unknown >;
	/**
	 * A label for the tooltip button, visible to screen readers.
	 */
	buttonLabel?: string;
	/**
	 * The size of the tooltip button.
	 *
	 * @default 16
	 */
	buttonSize?: number;
};

/**
 * Tooltip that shows on both hover and click.
 * To be used when the tooltip content is not interactive.
 *
 * @param {TooltipProps} props Component props.
 * @return {JSX.Element} Tooltip component.
 */
export const HoverTooltip: React.FC< React.PropsWithChildren<
	TooltipProps
> > = ( {
	isVisible,
	onHide = noop,
	children,
	buttonIcon,
	buttonLabel,
	buttonSize = 16,
	...props
} ) => {
	const [ isHovered, setIsHovered ] = useState( false );
	const [ isClicked, setIsClicked ] = useState( false );

	const handleMouseEnter = () => {
		setIsHovered( true );
	};
	const handleMouseLeave = () => {
		setIsHovered( false );
		onHide();
	};
	const handleMouseClick = () => {
		setIsClicked( ( val ) => ! val );
		if ( isClicked ) {
			onHide();
		}
	};
	const handleHide = () => {
		setIsHovered( false );
		setIsClicked( false );
		onHide();
	};

	return (
		<button
			className="wcpay-tooltip__content-wrapper"
			// on touch devices there's no mouse enter/leave, so we need to use a separate event (click/focus)
			// this creates 2 different (desirable) states on non-touch devices: if you hover and then click, the tooltip will persist
			onMouseEnter={ handleMouseEnter }
			onMouseLeave={ handleMouseLeave }
			onFocus={ handleMouseEnter }
			onBlur={ handleMouseLeave }
			onClick={ handleMouseClick }
			type={ 'button' }
		>
			<TooltipBase
				{ ...props }
				onHide={ handleHide }
				isVisible={ isVisible || isHovered || isClicked }
			>
				{ buttonIcon ? (
					<Icon
						icon={ buttonIcon }
						size={ buttonSize }
						aria-label={ buttonLabel }
					/>
				) : (
					children
				) }
			</TooltipBase>
		</button>
	);
};

/**
 * Tooltip that shows only on click events.
 * To be used when the tooltip content is interactive (e.g. links to documentation).
 *
 * @param {TooltipProps} props Component props.
 * @return {JSX.Element} Tooltip component.
 */
export const ClickTooltip: React.FC< React.PropsWithChildren<
	TooltipProps
> > = ( {
	isVisible,
	onHide = noop,
	buttonIcon,
	buttonLabel,
	buttonSize = 16,
	children,
	className,
	maxWidth,
	...props
} ) => {
	const [ isClicked, setIsClicked ] = useState( false );

	// For interactive tooltips, we pass the tooltip button as the tooltip content's parent element.
	// This will allow the tooltip content to render with the correct tab index, aiding keyboard navigation.
	// Otherwise, the tooltip will be appended to the end of the document with an incorrect tab index.
	const tooltipParentRef = useRef< HTMLButtonElement | null >( null );

	const handleMouseClick = () => {
		setIsClicked( ( val ) => ! val );
		if ( isClicked ) {
			onHide();
		}
	};
	const handleHide = () => {
		setIsClicked( false );
		onHide();
	};

	return (
		<button
			className="wcpay-tooltip__content-wrapper wcpay-tooltip--click__content-wrapper"
			onClick={ handleMouseClick }
			type={ 'button' }
			ref={ tooltipParentRef }
		>
			<TooltipBase
				{ ...props }
				parentElement={ tooltipParentRef.current || undefined }
				onHide={ handleHide }
				maxWidth={ maxWidth }
				isVisible={ isVisible || isClicked }
				className={ clsx( 'wcpay-tooltip--click__tooltip', className ) }
			>
				{ buttonIcon ? (
					<div
						tabIndex={ 0 }
						role="button"
						aria-label={ buttonLabel }
					>
						<Icon icon={ buttonIcon } size={ buttonSize } />
					</div>
				) : (
					children
				) }
			</TooltipBase>
		</button>
	);
};
