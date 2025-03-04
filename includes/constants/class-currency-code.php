<?php
/**
 * Class Currency_Code
 *
 * @package PooCommerce\Payments
 */

namespace WCPay\Constants;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Currency Code constants
 *
 * @psalm-immutale
 */
class Currency_Code extends Base_Constant {
	const UNITED_STATES_DOLLAR                    = 'USD'; // United States Dollar.
	const UNITED_ARAB_EMIRATES_DIRHAM             = 'AED'; // United Arab Emirates dirham.
	const AFGHAN_AFGHANI                          = 'AFN'; // Afghan afghani.
	const ALBANIAN_LEK                            = 'ALL'; // Albanian lek.
	const ARMENIAN_DRAM                           = 'AMD'; // Armenian dram.
	const NETHERLANDS_ANTILLEAN_GUILDER           = 'ANG'; // Netherlands Antillean guilder.
	const ANGOLAN_KWANZA                          = 'AOA'; // Angolan kwanza.
	const ARGENTINE_PESO                          = 'ARS'; // Argentine peso.
	const AUSTRALIAN_DOLLAR                       = 'AUD'; // Australian dollar.
	const ARUBAN_FLORIN                           = 'AWG'; // Aruban florin.
	const AZERBAIJANI_MANAT                       = 'AZN'; // Azerbaijani manat.
	const BOSNIA_AND_HERZEGOVINA_CONVERTIBLE_MARK = 'BAM'; // Bosnia and Herzegovina convertible mark.
	const BARBADOS_DOLLAR                         = 'BBD'; // Barbados dollar.
	const BANGLADESHI_TAKA                        = 'BDT'; // Bangladeshi taka.
	const BULGARIAN_LEV                           = 'BGN'; // Bulgarian lev.
	const BURUNDIAN_FRANC                         = 'BIF'; // Burundian franc.
	const BERMUDIAN_DOLLAR                        = 'BMD'; // Bermudian dollar.
	const BRUNEI_DOLLAR                           = 'BND'; // Brunei dollar.
	const BOLIVIANO                               = 'BOB'; // Boliviano.
	const BRAZILIAN_REAL                          = 'BRL'; // Brazilian real.
	const BAHAMIAN_DOLLAR                         = 'BSD'; // Bahamian dollar.
	const BOTSWANA_PULA                           = 'BWP'; // Botswana pula.
	const NEW_BELARUSIAN_RUBLE                    = 'BYN'; // New Belarusian ruble.
	const BELIZE_DOLLAR                           = 'BZD'; // Belize dollar.
	const CANADIAN_DOLLAR                         = 'CAD'; // Canadian dollar.
	const CONGOLESE_FRANC                         = 'CDF'; // Congolese franc.
	const SWISS_FRANC                             = 'CHF'; // Swiss franc.
	const CHILEAN_PESO                            = 'CLP'; // Chilean peso.
	const CHINESE_YUAN                            = 'CNY'; // Renminbi (Chinese yuan).
	const COLOMBIAN_PESO                          = 'COP'; // Colombian peso.
	const COSTA_RICAN_COLON                       = 'CRC'; // Costa Rican colon.
	const CAPE_VERDE_ESCUDO                       = 'CVE'; // Cape Verde escudo.
	const CZECH_KORUNA                            = 'CZK'; // Czech koruna.
	const DJIBOUTIAN_FRANC                        = 'DJF'; // Djiboutian franc.
	const DANISH_KRONE                            = 'DKK'; // Danish krone.
	const DOMINICAN_PESO                          = 'DOP'; // Dominican peso.
	const ALGERIAN_DINAR                          = 'DZD'; // Algerian dinar.
	const EGYPTIAN_POUND                          = 'EGP'; // Egyptian pound.
	const ETHIOPIAN_BIRR                          = 'ETB'; // Ethiopian birr.
	const EURO                                    = 'EUR'; // Euro.
	const FIJI_DOLLAR                             = 'FJD'; // Fiji dollar.
	const FALKLAND_ISLANDS_POUND                  = 'FKP'; // Falkland Islands pound.
	const POUND_STERLING                          = 'GBP'; // Pound sterling.
	const GEORGIAN_LARI                           = 'GEL'; // Georgian lari.
	const GIBRALTAR_POUND                         = 'GIP'; // Gibraltar pound.
	const GAMBIAN_DALASI                          = 'GMD'; // Gambian dalasi.
	const GUINEAN_FRANC                           = 'GNF'; // Guinean franc.
	const GUATEMALAN_QUETZAL                      = 'GTQ'; // Guatemalan quetzal.
	const GUYANESE_DOLLAR                         = 'GYD'; // Guyanese dollar.
	const HONG_KONG_DOLLAR                        = 'HKD'; // Hong Kong dollar.
	const HONDURAN_LEMPIRA                        = 'HNL'; // Honduran lempira.
	const HAITIAN_GOURDE                          = 'HTG'; // Haitian gourde.
	const HUNGARIAN_FORINT                        = 'HUF'; // Hungarian forint.
	const INDONESIAN_RUPIAH                       = 'IDR'; // Indonesian rupiah.
	const ISRAELI_NEW_SHEKEL                      = 'ILS'; // Israeli new shekel.
	const INDIAN_RUPEE                            = 'INR'; // Indian rupee.
	const ICELANDIC_KRONA                         = 'ISK'; // Icelandic króna.
	const JAMAICAN_DOLLAR                         = 'JMD'; // Jamaican dollar.
	const JAPANESE_YEN                            = 'JPY'; // Japanese yen.
	const KENYAN_SHILLING                         = 'KES'; // Kenyan shilling.
	const KYRGYZSTANI_SOM                         = 'KGS'; // Kyrgyzstani som.
	const CAMBODIAN_RIEL                          = 'KHR'; // Cambodian riel.
	const COMORIAN_FRANC                          = 'KMF'; // Comorian franc.
	const SOUTH_KOREAN_WON                        = 'KRW'; // South Korean won.
	const CAYMAN_ISLANDS_DOLLAR                   = 'KYD'; // Cayman Islands dollar.
	const KAZAKHSTANI_TENGE                       = 'KZT'; // Kazakhstani tenge.
	const LAO_KIP                                 = 'LAK'; // Lao kip.
	const LEBANESE_POUND                          = 'LBP'; // Lebanese pound.
	const SRI_LANKAN_RUPEE                        = 'LKR'; // Sri Lankan rupee.
	const LIBERIAN_DOLLAR                         = 'LRD'; // Liberian dollar.
	const LESOTHO_LOTI                            = 'LSL'; // Lesotho loti.
	const MOROCCAN_DIRHAM                         = 'MAD'; // Moroccan dirham.
	const MOLDOVAN_LEU                            = 'MDL'; // Moldovan leu.
	const MALAGASY_ARIARY                         = 'MGA'; // Malagasy ariary.
	const MACEDONIAN_DENAR                        = 'MKD'; // Macedonian denar.
	const MYANMAR_KYAT                            = 'MMK'; // Myanmar kyat.
	const MONGOLIAN_TOGROG                        = 'MNT'; // Mongolian tögrög.
	const MACANESE_PATACA                         = 'MOP'; // Macanese pataca.
	const MAURITIAN_RUPEE                         = 'MUR'; // Mauritian rupee.
	const MALDIVIAN_RUFIYAA                       = 'MVR'; // Maldivian rufiyaa.
	const MALAWIAN_KWACHA                         = 'MWK'; // Malawian kwacha.
	const MEXICAN_PESO                            = 'MXN'; // Mexican peso.
	const MALAYSIAN_RINGGIT                       = 'MYR'; // Malaysian ringgit.
	const MOZAMBICAN_METICAL                      = 'MZN'; // Mozambican metical.
	const NAMIBIAN_DOLLAR                         = 'NAD'; // Namibian dollar.
	const NIGERIAN_NAIRA                          = 'NGN'; // Nigerian naira.
	const NICARAGUAN_CORDOBA                      = 'NIO'; // Nicaraguan córdoba.
	const NORWEGIAN_KRONE                         = 'NOK'; // Norwegian krone.
	const NEPALESE_RUPEE                          = 'NPR'; // Nepalese rupee.
	const NEW_ZEALAND_DOLLAR                      = 'NZD'; // New Zealand dollar.
	const PANAMANIAN_BALBOA                       = 'PAB'; // Panamanian balboa.
	const PERUVIAN_SOL                            = 'PEN'; // Peruvian sol.
	const PAPUA_NEW_GUINEAN_KINA                  = 'PGK'; // Papua New Guinean kina.
	const PHILIPPINE_PESO                         = 'PHP'; // Philippine peso.
	const PAKISTANI_RUPEE                         = 'PKR'; // Pakistani rupee.
	const POLISH_ZLOTY                            = 'PLN'; // Polish złoty.
	const PARAGUAYAN_GUARANI                      = 'PYG'; // Paraguayan guaraní.
	const QATARI_RIYAL                            = 'QAR'; // Qatari riyal.
	const ROMANIAN_LEU                            = 'RON'; // Romanian leu.
	const SERBIAN_DINAR                           = 'RSD'; // Serbian dinar.
	const RUSSIAN_RUBLE                           = 'RUB'; // Russian ruble.
	const RWANDAN_FRANC                           = 'RWF'; // Rwandan franc.
	const SAUDI_RIYAL                             = 'SAR'; // Saudi riyal.
	const SOLOMON_ISLANDS_DOLLAR                  = 'SBD'; // Solomon Islands dollar.
	const SEYCHELLOIS_RUPEE                       = 'SCR'; // Seychellois rupee.
	const SWEDISH_KRONA                           = 'SEK'; // Swedish krona.
	const SINGAPORE_DOLLAR                        = 'SGD'; // Singapore dollar.
	const SAINT_HELENA_POUND                      = 'SHP'; // Saint Helena pound.
	const SIERRA_LEONEAN_LEONE                    = 'SLE'; // Sierra Leonean leone.
	const SOMALI_SHILLING                         = 'SOS'; // Somali shilling.
	const SURINAMESE_DOLLAR                       = 'SRD'; // Surinamese dollar.
	const SAO_TOME_AND_PRINCIPE_DOBRA             = 'STD'; // São Tomé and Príncipe dobra.
	const SWAZI_LILANGENI                         = 'SZL'; // Swazi lilangeni.
	const THAI_BAHT                               = 'THB'; // Thai baht.
	const TAJIKISTANI_SOMONI                      = 'TJS'; // Tajikistani somoni.
	const TONGAN_PAANGA                           = 'TOP'; // Tongan paʻanga.
	const TURKISH_LIRA                            = 'TRY'; // Turkish lira.
	const TRINIDAD_AND_TOBAGO_DOLLAR              = 'TTD'; // Trinidad and Tobago dollar.
	const NEW_TAIWAN_DOLLAR                       = 'TWD'; // New Taiwan dollar.
	const TANZANIAN_SHILLING                      = 'TZS'; // Tanzanian shilling.
	const UKRAINIAN_HRYVNIA                       = 'UAH'; // Ukrainian hryvnia.
	const UGANDAN_SHILLING                        = 'UGX'; // Ugandan shilling.
	const URUGUAYAN_PESO                          = 'UYU'; // Uruguayan peso.
	const UZBEKISTANI_SOM                         = 'UZS'; // Uzbekistani som.
	const VIETNAMESE_DONG                         = 'VND'; // Vietnamese đồng.
	const VANUATU_VATU                            = 'VUV'; // Vanuatu vatu.
	const SAMOAN_TALA                             = 'WST'; // Samoan tala.
	const CENTRAL_AFRICAN_CFA_FRANC               = 'XAF'; // Central African CFA franc.
	const EAST_CARIBBEAN_DOLLAR                   = 'XCD'; // East Caribbean dollar.
	const WEST_AFRICAN_CFA_FRANC                  = 'XOF'; // West African CFA franc.
	const CFP_FRANC                               = 'XPF'; // CFP franc.
	const YEMENI_RIAL                             = 'YER'; // Yemeni rial.
	const SOUTH_AFRICAN_RAND                      = 'ZAR'; // South African rand.
	const ZAMBIAN_KWACHA                          = 'ZMW'; // Zambian kwacha.
	// ... add more currencies as needed.
	// crypto currencies.
	const BITCOIN = 'BTC'; // Bitcoin.
}
