/**
 * Internal dependencies
 */
import { users } from './users.json';

export const config = {
	users: {
		...users,
		// the Atomic site is a live environment, and we're storing the user passwords as secrets
		// this is the only environment that is technically publicly accessible (for the GH action runners),
		// so it's semi-important that we don't use plaintext passwords.
		admin: {
			...users.admin,
			password:
				process.env.E2E_ADMIN_USER_PASSWORD || users.admin.password,
		},
		customer: {
			...users.customer,
			password:
				process.env.E2E_CUSTOMER_USER_PASSWORD ||
				users.customer.password,
		},
		'subscriptions-customer': {
			...users[ 'subscriptions-customer' ],
			password:
				process.env.E2E_SUBSCRIPTIONS_CUSTOMER_USER_PASSWORD ||
				users[ 'subscriptions-customer' ].password,
		},
		editor: {
			...users.editor,
			password:
				process.env.E2E_EDITOR_USER_PASSWORD || users.editor.password,
		},
	},
	products: {
		cap: {
			name: 'Cap',
			pageNumber: 1,
		},
		belt: {
			name: 'Belt',
			pageNumber: 1,
		},
		simple: {
			name: 'Beanie',
			pageNumber: 1,
		},
		sunglasses: {
			name: 'Sunglasses',
			pageNumber: 2,
		},
		variable: {
			name: 'Variable Product with Three Variations',
			pageNumber: 1,
		},
		grouped: {
			name: 'Grouped Product with Three Children',
			pageNumber: 1,
		},
		hoodie_with_logo: {
			name: 'Hoodie with Logo',
			pageNumber: 1,
		},
		subscription_signup_fee: {
			name: 'Subscription signup fee product',
			pageNumber: 2,
		},
		subscription_no_signup_fee: {
			name: 'Subscription no signup fee product',
			pageNumber: 2,
		},
		subscription_free_trial: {
			name: 'Subscription free trial product',
			pageNumber: 2,
		},
	} as Record< string, Product >,
	addresses: {
		admin: {
			store: {
				firstname: 'I am',
				lastname: 'Admin',
				company: 'Automattic',
				country: 'United States (US)',
				country_code: 'US',
				addressfirstline: '60 29th Street #343',
				addresssecondline: 'store',
				countryandstate: 'United States (US) — California',
				city: 'San Francisco',
				state: 'CA',
				postcode: '94110',
				email: 'e2e-wcpay-subscriptions-customer@poocommerce.com',
			},
		},
		customer: {
			billing: {
				firstname: 'I am',
				lastname: 'Customer',
				company: 'Automattic',
				country: 'United States (US)',
				country_code: 'US',
				addressfirstline: '60 29th Street #343',
				addresssecondline: 'billing',
				city: 'San Francisco',
				state: 'CA',
				postcode: '94110',
				phone: '123456789',
				email: 'e2e-wcpay-customer@poocommerce.com',
			},
			shipping: {
				firstname: 'I am',
				lastname: 'Recipient',
				company: 'Automattic',
				country: 'United States (US)',
				country_code: 'US',
				addressfirstline: '60 29th Street #343',
				addresssecondline: 'shipping',
				city: 'San Francisco',
				state: 'CA',
				postcode: '94110',
				phone: '123456789',
				email: 'e2e-wcpay-customer@poocommerce.com',
			},
		},
		'upe-customer': {
			billing: {
				be: {
					firstname: 'I am',
					lastname: 'Customer',
					company: 'Automattic',
					country: 'Belgium',
					country_code: 'BE',
					addressfirstline: 'Rue de l’Étuve, 1000',
					addresssecondline: 'billing-be',
					city: 'Bruxelles',
					postcode: '1000',
					phone: '123456789',
					email: 'e2e-wcpay-customer@poocommerce.com',
				},
				de: {
					firstname: 'I am',
					lastname: 'Customer',
					company: 'Automattic',
					country: 'Germany',
					country_code: 'DE',
					addressfirstline: 'Petuelring 130',
					addresssecondline: 'billing-de',
					city: 'München',
					postcode: '80809',
					state: 'DE-BY',
					phone: '123456789',
					email: 'e2e-wcpay-customer@poocommerce.com',
				},
			},
		},
		'subscriptions-customer': {
			billing: {
				firstname: 'I am',
				lastname: 'Subscriptions Customer',
				company: 'Automattic',
				country: 'United States (US)',
				country_code: 'US',
				addressfirstline: '60 29th Street #343',
				addresssecondline: 'billing',
				city: 'San Francisco',
				state: 'CA',
				postcode: '94110',
				phone: '123456789',
				email: 'e2e-wcpay-subscriptions-customer@poocommerce.com',
			},
			shipping: {
				firstname: 'I am',
				lastname: 'Subscriptions Recipient',
				company: 'Automattic',
				country: 'United States (US)',
				country_code: 'US',
				addressfirstline: '60 29th Street #343',
				addresssecondline: 'shipping',
				city: 'San Francisco',
				state: 'CA',
				postcode: '94110',
				phone: '123456789',
				email: 'e2e-wcpay-subscriptions-customer@poocommerce.com',
			},
		},
	},
	cards: {
		basic: {
			number: '4242424242424242',
			expires: {
				month: '02',
				year: '45',
			},
			cvc: '424',
			label: 'Visa ending in 4242',
		},
		basic2: {
			number: '4111111111111111',
			expires: {
				month: '11',
				year: '45',
			},
			cvc: '123',
			label: 'Visa ending in 1111',
		},
		basic3: {
			number: '378282246310005',
			expires: {
				month: '12',
				year: '45',
			},
			cvc: '1234',
			label: 'American Express ending in 0005',
		},
		'3ds': {
			number: '4000002760003184',
			expires: {
				month: '03',
				year: '45',
			},
			cvc: '525',
			label: 'Visa ending in 3184',
		},
		'3dsOTP': {
			number: '4000002500003155',
			expires: {
				month: '04',
				year: '45',
			},
			cvc: '626',
			label: 'Visa ending in 3155',
		},
		'3ds2': {
			number: '4000000000003220',
			expires: {
				month: '04',
				year: '45',
			},
			cvc: '626',
			label: 'Visa ending in 3220',
		},
		'disputed-fraudulent': {
			number: '4000000000000259',
			expires: {
				month: '05',
				year: '45',
			},
			cvc: '525',
			label: 'Visa ending in 0259',
		},
		'disputed-unreceived': {
			number: '4000000000002685',
			expires: {
				month: '06',
				year: '45',
			},
			cvc: '626',
			label: 'Visa ending in 2685',
		},
		declined: {
			number: '4000000000000002',
			expires: {
				month: '06',
				year: '45',
			},
			cvc: '626',
			label: 'Visa ending in 0002',
		},
		'declined-funds': {
			number: '4000000000009995',
			expires: {
				month: '06',
				year: '45',
			},
			cvc: '626',
			label: 'Visa ending in 9995',
		},
		'declined-incorrect': {
			number: '4242424242424241',
			expires: {
				month: '06',
				year: '45',
			},
			cvc: '626',
			label: 'Visa ending in 4241',
		},
		'declined-expired': {
			number: '4000000000000069',
			expires: {
				month: '06',
				year: '45',
			},
			cvc: '626',
			label: 'Visa ending in 0069',
		},
		'declined-cvc': {
			number: '4000000000000127',
			expires: {
				month: '06',
				year: '45',
			},
			cvc: '626',
			label: 'Visa ending in 0127',
		},
		'declined-processing': {
			number: '4000000000000119',
			expires: {
				month: '06',
				year: '45',
			},
			cvc: '626',
			label: 'Visa ending in 0119',
		},
		'declined-3ds': {
			number: '4000008400001629',
			expires: {
				month: '06',
				year: '45',
			},
			cvc: '626',
			label: 'Visa ending in 1629',
		},
		'invalid-exp-date': {
			number: '4242424242424242',
			expires: {
				month: '11',
				year: '12',
			},
			cvc: '123',
			label: 'Visa ending in 4242',
		},
		'invalid-cvv-number': {
			number: '4242424242424242',
			expires: {
				month: '06',
				year: '45',
			},
			cvc: '11',
			label: 'Visa ending in 4242',
		},
	},
	onboardingwizard: {
		industry: 'Test industry',
		numberofproducts: '1 - 10',
		sellingelsewhere: 'No',
	},
	settings: {
		shipping: {
			zonename: 'United States',
			zoneregions: 'United States (US)',
			shippingmethod: 'Free shipping',
		},
	},
};

export type CustomerAddress = Omit<
	typeof config.addresses.customer.billing,
	'state'
> & {
	state?: string;
};

export type Product = { name: string; pageNumber: number };
