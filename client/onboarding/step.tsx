/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { useStepperContext } from 'components/stepper';
import { OnboardingSteps } from './types';
import { useTrackAbandoned } from './tracking';
import strings from './strings';
import WooLogo from 'assets/images/woo-logo.svg';
import CloseIcon from 'assets/images/icons/close.svg?asset';
import './style.scss';

interface Props {
	name: OnboardingSteps;
	showHeading?: boolean;
}

const Step: React.FC< React.PropsWithChildren< Props > > = ( {
	name,
	children,
	showHeading = true,
} ) => {
	const { trackAbandoned } = useTrackAbandoned();
	const { exit } = useStepperContext();
	const handleExit = () => {
		trackAbandoned( 'exit' );
		exit();
	};

	return (
		<>
			<div className="stepper__nav">
				<img src={ WooLogo } alt="Woo" className="stepper__nav-logo" />
				<button
					type="button"
					className="stepper__nav-button"
					onClick={ handleExit }
				>
					<img src={ CloseIcon } alt="Close" />
				</button>
			</div>
			<div className="stepper__wrapper">
				{ showHeading && (
					<>
						<h1 className="stepper__heading">
							{ strings.steps[ name ].heading }
						</h1>
						<h2 className="stepper__subheading">
							{ strings.steps[ name ].subheading }
						</h2>
					</>
				) }
				<div className="stepper__content">{ children }</div>
			</div>
		</>
	);
};

export default Step;
