var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var htmlreplace = require('gulp-html-replace');
var insert = require('gulp-insert');
var replace = require('gulp-replace');
var clean = require('gulp-clean');
var es = require('event-stream');
var gulpUtil = require('gulp-util');
var expect = require('gulp-expect-file');
var removeEmptyLines = require('gulp-remove-empty-lines');

var ver = "2.1.0";

var bower_files = [
    "bower_components/jquery/dist/jquery.min.js",
    "bower_components/jquery-ui/jquery-ui.min.js",
    "bower_components/jquery.easing/js/jquery.easing.js",
    "bower_components/moment/moment.js",
    "bower_components/angular/angular.min.js",
    "bower_components/angular-sanitize/angular-sanitize.js",
    "bower_components/masonry/dist/masonry.pkgd.min.js",
    "bower_components/packery/dist/packery.pkgd.min.js",
    "bower_components/pace/pace.min.js",
    "bower_components/skycons-html5/skycons.js",
    "bower_components/angular-animate/angular-animate.min.js",
    "bower_components/angular-ui-router/release/angular-ui-router.js",
    "bower_components/angular-ui-router-tabs/src/ui-router-tabs.js",
    "bower_components/angular-ui-bootstrap-bower/ui-bootstrap-tpls.js",
    "bower_components/angular-ui-notification/dist/angular-ui-notification.min.js",
    "bower_components/jcrop/js/jquery.Jcrop.min.js",
    "bower_components/angular-filter/dist/angular-filter.js",
    "additional_components/jQuery.Sparklines/jquery.sparkline.js",
    "bower_components/flot/jquery.flot.js",
    "bower_components/flot/jquery.flot.time.js",
    "bower_components/flot/jquery.flot.resize.js",
    "bower_components/flot.curvedlines/curvedLines.js",
    "bower_components/flot/jquery.flot.pie.js",
    "bower_components/angular-timer/dist/angular-timer.js",
    "bower_components/flot.tooltip/js/jquery.flot.tooltip.min.js",
    "bower_components/angular-flot/angular-flot.js",
    "bower_components/angular-messages/angular-messages.js",
    "bower_components/sweetalert/dist/sweetalert-dev.js",
    "bower_components/signalr/jquery.signalR.min.js",
    "bower_components/lodash/dist/lodash.min.js",
    "bower_components/fastclick/lib/fastclick.js",
    "bower_components/angular-google-maps/dist/angular-google-maps.js",
    "bower_components/marker-animate-unobtrusive/vendor/markerAnimate.js",
    "bower_components/marker-animate-unobtrusive/SlidingMarker.js",
    "bower_components/humanize-duration/humanize-duration.js",
    "bower_components/angular-google-places-autocomplete/src/autocomplete.js",
    "bower_components/angular-dynamic-locale/src/tmhDynamicLocale.js",
    "bower_components/moment-timezone/builds/moment-timezone-with-data.js",
    "bower_components/angularjs-slider/dist/rzslider.js",
    "bower_components/intl-tel-input/build/js/utils.js",
    "bower_components/intl-tel-input/build/js/intlTelInput.min.js",
    "bower_components/bootstrap-daterangepicker/daterangepicker.js",
    "bower_components/ngtweet/dist/ngtweet.min.js",
    "bower_components/angular-ui-sortable/sortable.js",
    "bower_components/card/dist/card.js",
    "bower_components/angular-card/src/card.js",
    "bower_components/tinycolor/dist/tinycolor-min.js",
    "bower_components/tether/dist/js/tether.min.js",
    "bower_components/angular-color-picker/dist/angularjs-color-picker.min.js"

];

var e9_files = [
    "e9_components/services/Logger.service.js",
    "e9_components/services/ConsoleLoggingProvider.service.js",
    "e9_components/services/Model.service.js",
    "e9_components/services/Menu.service.js",
    "e9_components/services/Storage.service.js",
    "e9_components/services/Auth.service.js",
    "e9_components/services/Auth-Persist.service.js",
    "e9_components/services/ImageUpload.service.js",
    "e9_components/services/FileUpload.service.js",
    "e9_components/services/CSV.service.js",
    "e9_components/services/SignalR.service.js",
    "e9_components/services/Google.service.js",
    "e9_components/services/Currency.service.js",
    "e9_components/directives/uiSelect/select.js",
    "e9_components/directives/BindHtmlCompile.directive.js",
    "e9_components/directives/Card.directive.js",
    "e9_components/directives/FieldFor.directive.js",
    "e9_components/directives/StarRating.directive.js",
    "e9_components/directives/international-phone-number.js",
    "e9_components/directives/Score.directive.js",
    "e9_components/directives/tags.directive.js",
    "e9_components/filters/utility.filter.js",
    "e9_components/layouts/structure/page.controller.js",
    "e9_components/layouts/breadcrumb/breadcrumb.controller.js",
    "e9_components/layouts/threepanel/threepanel.controller.js",
    "e9_components/layouts/module/module-cards.controller.js",
    "e9_components/layouts/module/module-secondary-cards.controller.js",
    "e9_components/layouts/module/module-table.controller.js",
    "e9_components/layouts/module/module-item.controller.js",
    "e9_components/layouts/module/module-documents.controller.js",
    "e9_components/layouts/module/module-document-item.controller.js",
    "e9_components/directives/TableFor.directive.js",
    "e9_components/directives/ScrollRepeater.directive.js",
    "e9_components/directives/datepickerwide/directive.js",
    "e9_components/directives/InfoCard.directive.js",
    "e9_components/directives/VirtualizedRepeater.directive.js",
    "e9_components/directives/AddressFinder.directive.js",
    "e9_components/directives/instructions/directive.js",
    "src/js/marker-cluster.js",
    "src/js/Cab9.js"
];

var model_files = [
    "models/models.module.js",
    "models/AuditRecord.js",
    "models/Bill.js",
    "models/BillPayment.js",
    "models/Booking.js",
    "models/RepeatBooking.js",
    "models/BookingExpense.js",
    "models/BookingOffer.js",
    "models/BookingRequirement.js",
    "models/BookingStop.js",
    "models/ChangePassword.js",
    "models/Claim.js",
    "models/Client.js",
    "models/ClientDispatchSettings.js",
    "models/DriverPaymentModelOverride.js",
    "models/ClientAdjustment.js",
    "models/ClientInvoiceAdjustment.js",
    "models/ClientPricingModelAdjustment.js",
    "models/ClientReference.js",
    "models/ClientStaff.js",
    "models/ClientStaffRole.js",
    "models/ClientType.js",
    "models/CreditNote.js",
    "models/Company.js",
    "models/Conversation.js",
    "models/Currency.js",
    "models/DispatchSettings.js",
    "models/Document.js",
    "models/DocumentType.js",
    "models/Driver.js",
    "models/DriverPayment.js",
    "models/DriverAdjustment.js",
    "models/DriverPaymentAdjustment.js",
    "models/DriverPaymentModel.js",
    "models/DriverPaymentModelAdjustment.js",
    "models/DriverFixed.js",
    "models/DriverPaymentModelFixed.js",
    "models/DriverType.js",
    "models/EmailConfig.js",
    "models/Invoice.js",
    "models/InvoiceDetail.js",
    "models/FlightInfo.js",
    "models/GoogleMapsConfig.js",
    "models/KnownLocation.js",
    "models/KnownPickupPoint.js",
    "models/Location.js",
    "models/NewUser.js",
    "models/NotificationTemplates.js",
    "models/Note.js",
    "models/Passenger.js",
    "models/PassengerAddress.js",
    "models/Payment.js",
    "models/PricingFixed.js",
    "models/ClientPricingFixed.js",
    "models/PricingModel.js",
    "models/PricingModelVehicleTypePricing.js",
    "models/Zone.js",
    "models/ZoneInPricingModel.js",
    "models/ScoreWeighting.js",
    "models/Staff.js",
    "models/StaffRole.js",
    "models/Tax.js",
    "models/TaxComponent.js",
    "models/TaxType.js",
    "models/User.js",
    "models/Vehicle.js",
    "models/VehicleClass.js",
    "models/VehicleType.js",
    "models/VehicleTypeInDriverFixed.js",
    "models/VehicleTypeInDriverPaymentFixed.js",
    "models/VehicleTypeInPricingFixed.js",
    "models/VehicleTypeInClientPricingFixed.js",
    "models/BookingValidation.js",
    "models/ClientWebBookerSetting.js",
    "models/SmsDetails.js",
    "models/PaymentCard.js",
    "models/Transaction.js",
    "models/CompanyPaymentSettings.js",
    "models/CardPaymentProviderDetail.js",
    "models/AppConfig.js",
    "models/Partner.js",
    "models/PartnerDriver.js",
    "models/PartnerVehicle.js",
    "models/MaskedNumberProviderDetail.js",
    "models/WebBookerDetails.js",
    "models/PassengerAppInvitationDetail.js",
    "models/CompanyBiddingConfig.js",
    "models/DriverBid.js",
    "models/BiddingFilter.js",
    "models/BiddingExclusionRule.js",
    "models/AutoAllocationRule.js",
    "models/TelephonyCall.js",
    "models/TelephonyIntegration.js",
    "models/FTPDetails.js",
    "models/CancellationRule.js",
    "models/FlagDownConfiguration.js",
    "models/CompanyProfile.js",
    "models/Tag.js",
    "models/BookingTag.js",
    "models/LoyaltyConfig.js",
    "models/LoyaltyAccount.js"
]

var app_files = [
    "webapp/common/utilities/utilities.js",
    "webapp/common/common.module.js",
    "webapp/layout/sidebar-left/sidebar-left.controller.js",
    "webapp/client/layout/sidebar-left/sidebar-left.controller.js",
    "webapp/layout/topbar/topbar.controller.js",
    "webapp/layout/quick-nav/quick-nav.controller.js",
    "webapp/common/views/numplate/module-number-plate.controller.js",
    "webapp/common/views/numplate/module-number-plate-secondary.controller.js",
    "webapp/common/views/drivers/payments/controller.js",
    "webapp/common/views/drivers/adjustments/controller.js",
    "webapp/common/views/drivers/adjustments/modal/controller.js",
    "webapp/common/views/drivers/user/controller.js",
    "webapp/common/views/clients/invoices/controller.js",
    "webapp/common/views/clients/creditNotes/controller.js",
    "webapp/common/views/clients/staff/options.controller.js",
    "webapp/common/views/clients/staff/details/create.controller.js",
    "webapp/common/views/clients/staff/details/controller.js",
    "webapp/common/views/clients/staff/all/staff-module-stats.controller.js",
    "webapp/common/views/clients/staff/passengers/controller.js",
    "webapp/common/views/clients/passengers/options.controller.js",
    "webapp/common/views/clients/passengers/all/passengers-module-stats.controller.js",
    "webapp/common/views/clients/staff/user/controller.js",
    "webapp/common/views/clients/references/controller.js",
    "webapp/common/views/clients/references/modal/controller.js",
    "webapp/common/views/clients/bannedDrivers/controller.js",
    "webapp/common/views/clients/creditcards/controller.js",
    "webapp/common/views/clients/creditcards/cards/controller.js",
    "webapp/common/views/clients/creditcards/transactions/controller.js",
    "webapp/common/views/clients/webBookerSettings/controller.js",
    "webapp/common/views/clients/clientVehicleTypes/controller.js",
    "webapp/common/views/conversations/conversations.modal.controller.js",
    "webapp/common/views/driverpayments/controller.js",
    "webapp/common/views/driverpayments/details/controller.js",
    "webapp/common/views/driverpayments/bonus/controller.js",
    "webapp/common/views/cardtransactions/controller.js",
    "webapp/common/views/googlemapsconfig/controller.js",
    "webapp/common/directives/stopedit/directive.js",
    "webapp/common/directives/numplate.directive.js",
    "webapp/common/directives/promiseShadow.directive.js",
    "webapp/common/directives/editmodal/directive.js",
    "webapp/common/directives/input-dropdown/directive.js",
    "webapp/common/reports/reports.module.js",
    "webapp/common/reports/bookings-report/report.bookings.directive.js",
    "webapp/common/reports/client-bookings-report/report.bookings.directive.js",
    "webapp/common/reports/bookingSource-report/report.bookingSource.directive.js",
    "webapp/common/reports/client-report/report.client.directive.js",
    "webapp/common/reports/currency-report/report.currency.directive.js",
    "webapp/common/reports/driver-report/report.driver.directive.js",
    "webapp/common/reports/passenger-report/report.passenger.directive.js",
    "webapp/common/reports/paymentType-report/report.paymentType.directive.js",
    "webapp/common/reports/vehicleType-report/report.vehicleType.directive.js",
    "webapp/common/reports/vehicleClass-report/report.vehicleClass.directive.js",
    "webapp/common/modals/notes.modal.controller.js",
    "webapp/common/modals/quick-booking/controller.js",
    "webapp/common/modals/driver-payment-create.controller.js",
    "webapp/common/modals/user/controller.js",
    "webapp/common/modals/add-payment-card/controller.js",
    "webapp/common/modals/passenger/controller.js",
    "webapp/common/modals/webbooker/new/controller.js",
    "webapp/common/modals/webbooker/address/create.controller.js",
    "webapp/common/modals/webbooker/address/edit.controller.js",
    "webapp/common/views/passenger-address/controller.js",
    "webapp/common/modals/address/create.controller.js",
    "webapp/common/modals/address/edit.controller.js",
    "webapp/common/modals/bookings/driver-payment-calculation/controller.js",
    "webapp/common/modals/bookings/edit-booking/controller.js",
    "webapp/common/modals/booker/controller.js",
    "webapp/common/modals/bookings/reuse-booking/controller.js",
    "webapp/common/modals/bookings/stop-address/controller.js",
    "webapp/common/directives/mileagestep/directive.js",
    "webapp/common/directives/partner-card/directive.js",
    "webapp/common/directives/passengerprofile/directive.js",
    "webapp/common/directives/document/directive.js",
    "webapp/common/services/CustomMarker.service.js",
    "webapp/common/widgets/booking-report.widget.js",
    "webapp/common/widgets/booking-client-report.widget.js",
    "webapp/common/widgets/booking-source.widget.js",
    "webapp/common/widgets/booking-revenue.widget.js",
    "webapp/common/widgets/bookings-heatmap.widget.js",
    "webapp/common/widgets/unique-driver-passenger.widget.js",
    "webapp/common/widgets/client-report.widget.js",
    "webapp/common/widgets/driver-report.widget.js",
    "webapp/common/widgets/passenger-report.widget.js",
    "webapp/common/widgets/weather-report.widget.js",
    "webapp/common/widgets/twitter.widget.js",
    "webapp/common/widgets/staff-report.widget.js"
];

var management = [
    "webapp/management/dashboard/dashboard.module.js",
    "webapp/management/dashboard/dashboard.controller.js",
    "webapp/management/dispatch/dispatch.module.js",
    "webapp/management/dispatch/bookings/controller.js",
    "webapp/management/dispatch/workshare/controller.js",
    "webapp/management/dispatch/modals/filter/controller.js",
    "webapp/management/dispatch/modals/allocation/controller.js",
    "webapp/management/dispatch/modals/expenses/controller.js",
    "webapp/management/dispatch/modals/driver-bid/controller.js",
    "webapp/management/dispatch/modals/booking-info.controller.js",
    "webapp/management/dispatch/modals/shiftnotes/controller.js",
    "webapp/management/dispatch/drivers/controller.js",
    "webapp/management/dispatch/map/controller.js",
    "webapp/management/dispatch/new/controller.js",
    "webapp/management/dispatch/unconfirmed/controller.js",
    "webapp/management/dispatch/dispatch.controller.js",
    "webapp/management/dispatch/react/react.min.js",
    "webapp/management/bookings/bookings.module.js",
    "webapp/management/bookings/calls/controller.js",
    "webapp/management/bookings/booking-strip.directive.js",
    "webapp/management/bookings/validation/booking-validation-strip/booking-validation-strip.directive.js",
    "webapp/management/bookings/bookings-viewer.controller.js",
    "webapp/management/bookings/all/bookings-table.controller.js",
    "webapp/management/bookings/validation/booking-validation.controller.js",
    "webapp/management/bookings/cc-bookings/controller.js",
    "webapp/management/bookings/repeat/controller.js",
    "webapp/management/bookings/edit/booking-edit.controller.js",
    "webapp/management/bookings/new/booking-new.controller.js",
    "webapp/management/bookings/modals/filter.controller.js",
    "webapp/management/drivers/drivers.module.js",
    "webapp/management/drivers/all/drivers-module-options.controller.js",
    "webapp/management/drivers/all/drivers-module-stats.controller.js",
    "webapp/management/drivers/modals/driver-types-modal.controller.js",
    "webapp/management/drivers/item/driver-item-vehicles.controller.js",
    "webapp/management/drivers/item/driver-item-dashboard.controller.js",
    "webapp/management/drivers/item/driver-item-info.controller.js",
    "webapp/management/drivers/item/driver-item-create.controller.js",
    "webapp/management/drivers/item/driver-item-notes.controller.js",
    "webapp/management/drivers/item/fixed/controller.js",
    "webapp/management/drivers/item/transactions/controller.js",
    "webapp/management/drivers/bookings/controller.js",
    "webapp/management/drivers/paymentmodels/model-assignments-controller.js",
    "webapp/management/drivers/estimates/controller.js",
    "webapp/management/drivers/expenses/controller.js",
    "webapp/management/drivers/shifts/controller.js",
    "webapp/management/drivers/all/driver-paged-table.controller.js",
    "webapp/management/vehicles/vehicles.module.js",
    "webapp/management/vehicles/all/vehicles-module-options.controller.js",
    "webapp/management/vehicles/all/vehicles-module-stats.controller.js",
    "webapp/management/vehicles/modals/vehicle-classes-modal.controller.js",
    "webapp/management/vehicles/item/vehicle-item-dashboard.controller.js",
    "webapp/management/vehicles/item/vehicle-item-info.controller.js",
    "webapp/management/vehicles/item/vehicle-item-notes.controller.js",
    "webapp/management/vehicles/item/vehicle-item-create.controller.js",
    "webapp/management/vehicles/all/vehicle-paged-table.controller.js",
    "webapp/management/clients/clients.module.js",
    "webapp/management/clients/item/fixed/controller.js",
    "webapp/management/clients/all/clients-module-options.controller.js",
    "webapp/management/clients/all/clients-module-stats.controller.js",
    "webapp/management/clients/modals/client-types-modal.controller.js",
    "webapp/management/clients/item/client-item-dashboard.controller.js",
    "webapp/management/clients/item/client-item-info.controller.js",
    "webapp/management/clients/item/client-item-create.controller.js",
    "webapp/management/clients/item/client-item-notes.controller.js",
    "webapp/management/clients/item/client-item-passengers.controller.js",
    "webapp/management/clients/item/client-item-profiles.controller.js",
    "webapp/management/clients/item/client-item-locations.controller.js",
    "webapp/management/clients/item/client-item-adjustments.controller.js",
    "webapp/management/clients/item/advanced/controller.js",
    "webapp/management/clients/item/invite/controller.js",
    "webapp/management/clients/pricingmodels/model-assignments-controller.js",
    "webapp/management/clients/profitability/profitability.controller.js",
    "webapp/management/clients/conversations/conversations.controller.js",
    "webapp/management/clients/conversations/conversation.selected.controller.js",
    "webapp/management/clients/bookings/controller.js",
    "webapp/common/views/clients/creditcards/controller.js",
    "webapp/management/passengers/passengers.module.js",
    "webapp/management/passengers/all/passengers-module-options.controller.js",
    "webapp/management/passengers/all/passengers-module-stats.controller.js",
    "webapp/management/passengers/all/cards.controller.js",
    "webapp/management/passengers/item/passenger-item-dashboard.controller.js",
    "webapp/management/passengers/item/passenger-item-info.controller.js",
    "webapp/management/passengers/item/passenger-loyalty-account.controller.js",
    "webapp/management/passengers/item/passenger-item-notes.controller.js",
    "webapp/management/passengers/item/bannedDrivers/controller.js",
    //    "webapp/management/passengers/addresses/controller.js",
    //    "webapp/management/passengers/item/passenger-item-create.controller.js",
    "webapp/management/settings/settings.module.js",
    "webapp/management/settings/exports/exports.settings.module.js",
    "webapp/management/settings/pricingmodels/pricing-models.controller.js",
    "webapp/management/settings/pricingmodels/adjustments/controller.js",
    "webapp/management/settings/pricingmodels/adjustments/modal/controller.js",
    "webapp/management/settings/pricingmodels/fixed/controller.js",
    "webapp/management/settings/pricingmodels/price-list/controller.js",
    "webapp/management/settings/taxes/edit.controller.js",
    "webapp/management/settings/import/import.settings.module.js",
    "webapp/management/settings/taxes/create.controller.js",
    "webapp/management/settings/company/company-settings.controller.js",
    "webapp/management/settings/company/maskednumber/controller.js",
    "webapp/management/settings/email/email-config.controller.js",
    "webapp/management/settings/email/email-template.controller.js",
    "webapp/management/settings/users/users-config.controller.js",
    "webapp/management/settings/roles/roles-config.controller.js",
    "webapp/management/settings/profile/profile.controller.js",
    "webapp/management/settings/integrations/filter-directive/directive.js",
    "webapp/management/settings/telephony/controller.js",
    "webapp/management/settings/loyalty/controller.js",
    "webapp/management/settings/driverpayments/adjustments/controller.js",
    "webapp/management/settings/driverpayments/adjustments/modal/controller.js",
    "webapp/management/settings/known-locations/known-locations.controller.js",
    "webapp/management/settings/dispatch/dispatch.controller.js",
    "webapp/management/settings/specialrequirements/controller.js",
    "webapp/management/settings/booking/booking-form/controller.js",
    "webapp/management/settings/booking/expenses/controller.js",
    "webapp/management/settings/booking/expenses/modal/controller.js",
    "webapp/management/settings/company/auction-config/controller.js",
    "webapp/management/settings/company/auto-allocation/controller.js",
    "webapp/management/settings/company/flagdown-config/controller.js",
    "webapp/management/settings/company/auction-config/modals/create-edit.controller.js",
    "webapp/management/settings/company/auction-config/modals/create-edit-exclusion.controller.js",
    "webapp/management/settings/company/auto-allocation/modals/create-edit.controller.js",
    "webapp/management/settings/company/auto-allocation/modals/create-edit-exclusion.controller.js",
    "webapp/management/settings/zones/zone-management.controller.js",
    "webapp/management/settings/app-settings/controller.js",
    "webapp/management/settings/tags/controller.js",
    "webapp/management/staff/staff.module.js",
    "webapp/management/staff/all/staff-module-options.controller.js",
    "webapp/management/staff/all/staff-module-stats.controller.js",
    "webapp/management/staff/item/staff-item-create.controller.js",
    "webapp/management/staff/modals/staff-types-modal.controller.js",
    "webapp/management/staff/item/staff-item-dashboard.controller.js",
    "webapp/management/staff/item/staff-item-info.controller.js",
    "webapp/management/staff/item/staff-item-notes.controller.js",
    "webapp/management/staff/item/staff-item-user.controller.js",
    "webapp/management/upcoming/upcoming.module.js",
    "webapp/management/invoicing/invoices.module.js",
    "webapp/management/invoicing/invoicing-summary.controller.js",
    "webapp/management/invoicing/creditnotes/all/table.controller.js",
    "webapp/management/invoicing/creditnotes/modals/new-creditnote/controller.js",
    "webapp/management/invoicing/creditnotes/item/creditnote-edit.controller.js",
    "webapp/management/invoicing/invoices/all/table.controller.js",
    "webapp/management/invoicing/invoices/item/invoice-create.controller.js",
    "webapp/management/invoicing/invoices/item/invoice-edit.controller.js",
    "webapp/management/invoicing/invoices/modals/new-invoice/controller.js",
    "webapp/management/invoicing/invoices/modals/payments-modal.controller.js",
    "webapp/management/invoicing/driver-invoices/table.controller.js",
    "webapp/management/driver-payments-new/driver-payments.module.js",
    "webapp/management/driver-payments/driver-payments.module.js",
    "webapp/management/driver-payments/all/driver-payments.controller.js",
    "webapp/management/driver-payments/item/driver-payments-item.controller.js",
    "webapp/management/driver-payments/item/driver-payments-create.controller.js",
    "webapp/management/driver-payments/item/driver-payment-payments.controller.js",
    "webapp/management/driver-payments/item/adjustments/view.controller.js",
    "webapp/management/driver-payments/item/adjustments/create.controller.js",
    "webapp/management/driver-payments/modal/new-payment/controller.js",
    "webapp/management/settings/driverpayments/fixed/controller.js",
    "webapp/management/reports/reports.module.js",
    "webapp/management/vehicles/item/vehicle-type/controller.js",
    "webapp/management/reports/all/reports.controller.js",
    "webapp/management/utilities/utilities.module.js",
    "webapp/management/utilities/documents/all/controller.js",
    "webapp/management/utilities/documents/all/options.controller.js",
    "webapp/management/conversations/conversations.module.js",
    "webapp/management/workshare/module.js",
    "webapp/management/app.js",
    "webapp/management/workshare/company/controller.js",
    "webapp/management/workshare/company/profile/controller.js",
    "webapp/management/workshare/company/coverage-area/controller.js",
    "webapp/management/workshare/company/live-drivers/controller.js",
    "webapp/management/workshare/company/fleet/controller.js",
    "webapp/management/workshare/company/document/controller.js",
    "webapp/management/workshare/company/partners/controller.js",
    "webapp/management/workshare/discover-partner/controller.js",
    "webapp/management/workshare/discover-partner/item/controller.js",
    "webapp/management/workshare/discover-partner/item/details/controller.js",
    "webapp/management/workshare/discover-partner/item/pricing/controller.js",
    "webapp/management/workshare/discover-partner/item/live/controller.js",
    "webapp/management/workshare/discover-partner/item/fleet/controller.js",
    "webapp/management/workshare/discover-partner/item/documents/controller.js",
    "webapp/management/workshare/discover-partner/modals/controller.js",
    "webapp/management/workshare/requests/controller.js"
];
var client = [
    "webapp/client/app.js",
    "webapp/client/dashboard/dashboard.module.js",
    "webapp/client/dashboard/dashboard.controller.js",
    "webapp/client/bookings/bookings.module.js",
    "webapp/client/bookings/bookings-table.controller.js",
    "webapp/client/bookings/booking-strip.directive.js",
    "webapp/client/bookings/bookings-viewer.controller.js",
    "webapp/client/bookings/edit/booking-edit.controller.js",
    "webapp/client/bookings/new/controller.js",
    "webapp/common/views/clients/creditcards/controller.js",
    "webapp/client/passengers/passengers.module.js",
    "webapp/client/passengers/all/passengers-module-options.controller.js",
    "webapp/client/passengers/all/passengers-module-stats.controller.js",
    "webapp/client/passengers/item/passenger-item-dashboard.controller.js",
    "webapp/client/passengers/item/passenger-item-info.controller.js",
    "webapp/client/passengers/item/passenger-item-notes.controller.js",
    //"webapp/client/passengers/item/passenger-item-create.controller.js",
    "webapp/client/locations/locations.module.js",
    "webapp/client/locations/controller.js",
    "webapp/client/locations/create.controller.js",
    "webapp/client/invoices/invoices.module.js",
    "webapp/client/invoices/all/table.controller.js",
    "webapp/client/invoices/item/invoice-edit.controller.js",
    "webapp/client/invoices/modals/payments-modal.controller.js",
    "webapp/client/settings/settings.module.js",
    "webapp/client/settings/details/details.controller.js",
    "webapp/client/settings/profile/profile.controller.js",
    "webapp/client/staff/staff.module.js",
    "webapp/client/widgets/client-booking-report.widget.js",
    "webapp/client/bookings/modals/driver-tracking/controller.js",
    "webapp/client/reports/reports.module.js",
    "webapp/client/reports/all/reports.controller.js"
];
var driver = [
    "webapp/driver/app.js",
    "webapp/driver/bookings/bookings.module.js",
    "webapp/driver/bookings/bookings-table.controller.js",
    "webapp/driver/bookings/booking-strip.directive.js",
    "webapp/driver/vehicles/vehicles.module.js",
    "webapp/driver/vehicles/all/vehicles-module-options.controller.js",
    "webapp/driver/vehicles/item/vehicle-item-info.controller.js",
    "webapp/driver/vehicles/item/vehicle-item-dashboard.controller.js",
    "webapp/driver/settings/settings.module.js",
    "webapp/driver/settings/profile/profile.controller.js",
    "webapp/driver/settings/password/change-password.controller.js",
    "webapp/common/views/clients/creditcards/controller.js"
];
var passenger = [
    "webapp/passenger/app.js",
    "webapp/passenger/dashboard/dashboard.module.js",
    "webapp/passenger/dashboard/dashboard.controller.js",
    "webapp/passenger/bookings/bookings.module.js",
    "webapp/passenger/bookings/bookings-table.controller.js",
    "webapp/passenger/bookings/booking-strip.directive.js",
    "webapp/passenger/bookings/bookings-viewer.controller.js",
    "webapp/passenger/bookings/edit/booking-edit.controller.js",
    "webapp/passenger/profile/profile.module.js",
    "webapp/passenger/profile/profile.controller.js"
];
var print = [
    "bower_components/jquery/dist/jquery.min.js",
    "bower_components/jquery.easing/js/jquery.easing.js",
    "bower_components/angular/angular.min.js",
    "bower_components/angular-ui-router/release/angular-ui-router.js",
    "bower_components/angular-ui-bootstrap-bower/ui-bootstrap-tpls.js",
    "bower_components/angular-ui-select/dist/select.min.js",
    "bower_components/moment/moment.js",
    "bower_components/angular-flot/angular-flot.js",
    "bower_components/flot/jquery.flot.js",
    "bower_components/flot/jquery.flot.time.js",
    "bower_components/flot/jquery.flot.pie.js",
    "bower_components/flot.tooltip/js/jquery.flot.tooltip.min.js",
    "bower_components/angular-dynamic-locale/tmhDynamicLocale.min.js",
    "bower_components/angular-google-maps/dist/angular-google-maps.js",
    "bower_components/angular-google-places-autocomplete/src/autocomplete.js",
    "e9_components/services/CSV.service.js",
    "e9_components/services/Google.service.js",
    "e9_components/services/Currency.service.js",
    "e9_components/filters/utility.filter.js",
    "webapp/common/views/clients/creditcards/controller.js",
    "webapp/common/common.module.js",
    "webapp/common/reports/reports.module.js",
    "webapp/common/reports/bookings-report/report.bookings.directive.js",
    "webapp/common/reports/client-bookings-report/report.bookings.directive.js",
    "webapp/common/reports/bookingSource-report/report.bookingSource.directive.js",
    "webapp/common/reports/client-report/report.client.directive.js",
    "webapp/common/reports/currency-report/report.currency.directive.js",
    "webapp/common/reports/driver-report/report.driver.directive.js",
    "webapp/common/reports/passenger-report/report.passenger.directive.js",
    "webapp/common/reports/paymentType-report/report.paymentType.directive.js",
    "webapp/common/reports/vehicleType-report/report.vehicleType.directive.js",
    "webapp/common/reports/vehicleClass-report/report.vehicleClass.directive.js"
]

var Exports = [
    "Exports/common/jquery/jquery.min.js",
    "Exports/common/bootstrap/js/bootstrap.min.js",
    "Exports/common/angular/angular.min.js",
    "Exports/common/moment/moment.js",
    "Exports/common/moment-timezone/builds/moment-timezone-with-data.js",
    "Exports/common/angular-dynamic-locale/src/tmhDynamicLocale.js",
    "Exports/common.js"
];

var client_reuse_booking = [
    "webapp/client/bookings/modals/reuse-booking/controller.js"
]

var mngmnt_reuse_booking = [
    "webapp/common/modals/bookings/reuse-booking/controller.js"
]

var edit_booking = [
    "webapp/common/modals/bookings/edit-booking/controller.js"
]

var track = [
    "bower_components/jquery/dist/jquery.min.js",
    "bower_components/jquery-ui/jquery-ui.min.js",
    "bower_components/jquery.easing/js/jquery.easing.js",
    "bower_components/moment/moment.js",
    "bower_components/moment-timezone/builds/moment-timezone-with-data.js",
    "bower_components/angular/angular.min.js",
    "bower_components/angular-sanitize/angular-sanitize.js",
    "bower_components/signalr/jquery.signalR.min.js",
    "bower_components/marker-animate-unobtrusive/vendor/markerAnimate.js",
    "bower_components/marker-animate-unobtrusive/SlidingMarker.js",
    "bower_components/angular-dynamic-locale/src/tmhDynamicLocale.js",
    "e9_components/services/SignalR.service.js",
    "e9_components/filters/utility.filter.js",
    "e9_components/services/Currency.service.js",
    "track/controller.js"
]


var modules = ['management', 'client', 'driver', 'passenger'];
var export_modules = ['Bill', 'BookingReceipt', 'DriverInvoice', 'Invoice'];

var htmlReplaceOptions = {
    keepUnassigned: true,
    keepBlockTags: true
}

gulp.task('compile-all', ['compile-bower', 'compile-common', 'compile-app', 'compile-model', 'compile-bower', 'compile-management', 'compile-client', 'compile-driver', 'compile-passenger', 'compile-print', 'compile-exports', 'compile-client-reuse-booking', 'compile-mngmnt-reuse-booking', 'compile-edit-booking', 'compile-track']);

gulp.task('compile-model', function () {
    return gulp.src(model_files)
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('models.min.js'))
        .pipe(gulp.dest('includes/js'));
});
gulp.task('compile-bower', function () {
    return gulp.src(bower_files)
        .pipe(expect(bower_files))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('dependencies.min.js'))
        .pipe(gulp.dest('includes/js'));
});
gulp.task('compile-common', function () {
    return gulp.src(e9_files)
        .pipe(expect(e9_files))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('components.min.js'))
        .pipe(gulp.dest('includes/js'));
});
gulp.task('compile-app', function () {
    return gulp.src(app_files)
        .pipe(expect(app_files))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('app.min.js'))
        .pipe(gulp.dest('includes/js'));
});
gulp.task('compile-management', function () {
    return gulp.src(management)
        .pipe(expect(management))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('management.min.js'))
        .pipe(gulp.dest('includes/js'));
});
gulp.task('compile-client', function () {
    return gulp.src(client)
        .pipe(expect(client))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('client.min.js'))
        .pipe(gulp.dest('includes/js'));
});
gulp.task('compile-driver', function () {
    return gulp.src(driver)
        .pipe(expect(driver))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('driver.min.js'))
        .pipe(gulp.dest('includes/js'));
});
gulp.task('compile-passenger', function () {
    return gulp.src(passenger)
        .pipe(expect(passenger))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('passenger.min.js'))
        .pipe(gulp.dest('includes/js'));
});
gulp.task('compile-print', function () {
    return gulp.src(print)
        .pipe(expect(print))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('print.min.js'))
        .pipe(gulp.dest('includes/js'));
});
gulp.task('compile-exports', function () {
    return gulp.src(Exports)
        .pipe(expect(Exports))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('exports.min.js'))
        .pipe(gulp.dest('Exports/js'));
});
gulp.task('compile-client-reuse-booking', function () {
    return gulp.src(client_reuse_booking)
        .pipe(expect(client_reuse_booking))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('client-reuse-booking.min.js'))
        .pipe(gulp.dest('includes/js'));
});
gulp.task('compile-mngmnt-reuse-booking', function () {
    return gulp.src(mngmnt_reuse_booking)
        .pipe(expect(mngmnt_reuse_booking))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('mngmnt-reuse-booking.min.js'))
        .pipe(gulp.dest('includes/js'));
});
gulp.task('compile-edit-booking', function () {
    return gulp.src(edit_booking)
        .pipe(expect(edit_booking))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('edit-booking.min.js'))
        .pipe(gulp.dest('includes/js'));
});
gulp.task('compile-track', function () {
    return gulp.src(track)
        .pipe(expect(track))
        .pipe(uglify().on('error', gulpUtil.log))
        .pipe(insert.append(';;;'))
        .pipe(concat('track.min.js'))
        .pipe(gulp.dest('includes/js'));
});

gulp.task('build-debug', function () {
    var op = modules.map(function (module) {
        return gulp.src("webapp/" + module + "/index.html")
            .pipe(htmlreplace({
                'bower': bower_files.map(prependSlash),
                'components': e9_files.map(prependSlash),
                'app': app_files.map(prependSlash),
                'model': model_files.map(prependSlash),
                'individual': eval(module).map(prependSlash)
            }, htmlReplaceOptions))
            .pipe(removeEmptyLines())
            .pipe(gulp.dest("webapp/" + module));
    });
    var op1 = gulp.src(['print-reports.html'])
        .pipe(htmlreplace({
            'print': print.map(prependSlash)
        }, htmlReplaceOptions))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest(''));
    op.push(op1);

    var op2 = export_modules.map(function (module) {
        return gulp.src("Exports/" + module + "/template.html")
            .pipe(htmlreplace({
                'exports': Exports.map(prependSlash)
            }, htmlReplaceOptions))
            .pipe(removeEmptyLines())
            .pipe(gulp.dest("Exports/" + module));
    });
    [].push.apply(op, op2);

    var op3 = gulp.src("webapp/common/modals/bookings/edit-booking/window.html")
        .pipe(htmlreplace({
            'bower': bower_files.map(prependSlash),
            'components': e9_files.map(prependSlash),
            'app': app_files.map(prependSlash),
            'model': model_files.map(prependSlash),
            'individual': edit_booking.map(prependSlash)
        }, htmlReplaceOptions))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest("webapp/common/modals/bookings/edit-booking/"));

    [].push.apply(op, op3);

    var op4 = gulp.src("webapp/client/bookings/modals/reuse-booking/window.html")
        .pipe(htmlreplace({
            'bower': bower_files.map(prependSlash),
            'components': e9_files.map(prependSlash),
            'app': app_files.map(prependSlash),
            'model': model_files.map(prependSlash),
            'individual': client_reuse_booking.map(prependSlash)
        }, htmlReplaceOptions))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest("webapp/client/bookings/modals/reuse-booking/"));

    [].push.apply(op, op4);

    var op6 = gulp.src("webapp/common/modals/bookings/reuse-booking/window.html")
        .pipe(htmlreplace({
            'bower': bower_files.map(prependSlash),
            'components': e9_files.map(prependSlash),
            'app': app_files.map(prependSlash),
            'model': model_files.map(prependSlash),
            'individual': mngmnt_reuse_booking.map(prependSlash)
        }, htmlReplaceOptions))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest("webapp/common/modals/bookings/reuse-booking/"));

    [].push.apply(op, op4);

    var op5 = gulp.src("track/index.html")
        .pipe(htmlreplace({
            'individual': track.map(prependSlash)
        }, htmlReplaceOptions))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest("track/"));

    [].push.apply(op, op5);


    return es.merge(op);
});

gulp.task('build-prod', ['compile-all'], function () {
    var op = modules.map(function (module) {
        return gulp.src("webapp/" + module + "/index.html")
            .pipe(htmlreplace({
                'bower': '/includes/js/dependencies.min.js' + '?ver=' + ver,
                'model': '/includes/js/models.min.js' + '?ver=' + ver,
                'components': '/includes/js/components.min.js' + '?ver=' + ver,
                'app': '/includes/js/app.min.js' + '?ver=' + ver,
                'individual': '/includes/js/' + module + '.min.js' + '?ver=' + ver
            }, htmlReplaceOptions))
            .pipe(removeEmptyLines())
            .pipe(gulp.dest("webapp/" + module));
    });
    var op1 = gulp.src(['print-reports.html'])
        .pipe(htmlreplace({
            'print': '/includes/js/print.min.js'
        }, htmlReplaceOptions))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest(''));
    op.push(op1);

    var op2 = export_modules.map(function (module) {
        return gulp.src("Exports/" + module + "/template.html")
            .pipe(htmlreplace({
                'exports': '/Exports/common/js/exports.min.js?ver=' + ver
            }, htmlReplaceOptions))
            .pipe(removeEmptyLines())
            .pipe(gulp.dest("Exports/" + module));
    });

    Array.prototype.push.apply(op, op2);

    var op3 = gulp.src("webapp/client/bookings/modals/reuse-booking/window.html")
        .pipe(htmlreplace({
            'bower': '/includes/js/dependencies.min.js' + '?ver=' + ver,
            'model': '/includes/js/models.min.js' + '?ver=' + ver,
            'components': '/includes/js/components.min.js' + '?ver=' + ver,
            'app': '/includes/js/app.min.js' + '?ver=' + ver,
            'individual': '/includes/js/client-reuse-booking.min.js' + '?ver=' + ver
        }, htmlReplaceOptions))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest("webapp/client/bookings/modals/reuse-booking/"));

    Array.prototype.push.apply(op, op3);

    var op5 = gulp.src("webapp/common/modals/bookings/edit-booking/window.html")
        .pipe(htmlreplace({
            'bower': '/includes/js/dependencies.min.js' + '?ver=' + ver,
            'model': '/includes/js/models.min.js' + '?ver=' + ver,
            'components': '/includes/js/components.min.js' + '?ver=' + ver,
            'app': '/includes/js/app.min.js' + '?ver=' + ver,
            'individual': '/includes/js/edit-booking.min.js' + '?ver=' + ver
        }, htmlReplaceOptions))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest("webapp/common/modals/bookings/edit-booking/"));

    Array.prototype.push.apply(op, op5);

    var op6 = gulp.src("webapp/common/modals/bookings/reuse-booking/window.html")
        .pipe(htmlreplace({
            'bower': '/includes/js/dependencies.min.js' + '?ver=' + ver,
            'model': '/includes/js/models.min.js' + '?ver=' + ver,
            'components': '/includes/js/components.min.js' + '?ver=' + ver,
            'app': '/includes/js/app.min.js' + '?ver=' + ver,
            'individual': '/includes/js/mngmnt-reuse-booking.min.js' + '?ver=' + ver
        }, htmlReplaceOptions))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest("webapp/common/modals/bookings/reuse-booking/"));

    Array.prototype.push.apply(op, op6);

    var op4 = gulp.src("track/index.html")
        .pipe(htmlreplace({
            'individual': '/includes/js/track.min.js' + '?ver=' + ver
        }, htmlReplaceOptions))
        .pipe(removeEmptyLines())
        .pipe(gulp.dest("track/"));

    Array.prototype.push.apply(op, op4);

    return es.merge(op);
});

var copyPaths = [
    "*.html",
    "includes/fonts/**/*",
    "includes/css/**/*",
    "includes/icons/**/*",
    "includes/images/**/*",
    "includes/js/*.min.js",
    "Exports/**/*.html",
    "Exports/**/*.js",
    "Exports/**/*.css",
    "track/**/*.html",
    "webapp/config.js",
    "Web.config",
    "bower_components/angularjs-slider/dist/rzslider.css",
    "bower_components/bootstrap/fonts/**/*",
    "Uploads/Imports/**/*"
];

gulp.task('build-dist', ['copy-core-and-replace-endpoint', 'copy-templates'], function () {

});

gulp.task('clean-dist', function () {
    return gulp.src('dist', {
            read: false
        })
        .pipe(clean());
});

gulp.task('copy-core', ['build-prod'], function () {
    return gulp.src(copyPaths, {
            base: '../cab9.web/'
        })
        .pipe(gulp.dest('dist/'))
});

gulp.task('copy-core-only', function () {
    return gulp.src(copyPaths, {
            base: '../cab9.web/'
        })
        .pipe(gulp.dest('dist/'))
});

gulp.task('copy-templates', function () {
    return gulp.src(['webapp/**/*.html', 'e9_components/**/*.html'], {
            base: '../cab9.web'
        })
        .pipe(gulp.dest('dist/'))
});

gulp.task('copy-core-and-replace-endpoint', ['copy-core'], function () {
    var promises = [];
    promises.push(gulp.src(['dist/login.html'])
        .pipe(replace(/(window.endpoint\s?=\s?['"])(.+)(['"];?)/g, '$1https://api.cab9.co/$3'))
        .pipe(replace(/(<script src=")(.+)(signalr\/hubs"><\/script>)/g, '$1https://api.cab9.co/$3'))
        .pipe(gulp.dest('dist/')));

    promises.push(gulp.src(['dist/track/index.html'])
        .pipe(replace(/(window.endpoint\s?=\s?['"])(.+)(['"];?)/g, '$1https://api.cab9.co/$3'))
        .pipe(replace(/(<script src=")(.+)(signalr\/hubs"><\/script>)/g, '$1https://api.cab9.co/$3'))
        .pipe(gulp.dest('dist/track/')));

    for (var i = 0; i < modules.length; i++) {
        promises.push(gulp.src(['webapp/' + modules[i] + "/index.html"])
            .pipe(replace(/(window.endpoint\s?=\s?['"])(.+)(['"];?)/g, '$1https://api.cab9.co/$3'))
            .pipe(replace(/(<script src=")(.+)(signalr\/hubs"><\/script>)/g, '$1https://api.cab9.co/$3'))
            .pipe(gulp.dest('dist/webapp/' + modules[i])));
    }

    return es.merge(promises);
});

//gulp.task('replace-endpoint-debug', function() {
//    var op = getTasks("webapp/", "$1https://api.cab9.co/$3");
//    var op1 = getTasks("dist/webapp/", "$1https://api.cab9.co/$3");

//    var op2 = gulp.src(['login.html', 'print-reports.html'])
//        //.pipe(replace(/(window.endpoint\s?=\s?['"])(.+)(['"];?)/g, '$1https://api.cab9.co/$3'))
//        .pipe(gulp.dest(''));

//    var op3 = gulp.src(['dist/login.html', 'dist/print-reports.html'])
//        //.pipe(replace(/(window.endpoint\s?=\s?['"])(.+)(['"];?)/g, '$1https://api.cab9.co/$3'))
//        .pipe(gulp.dest('dist/'));

//    var op4 = gulp.src(['track/index.html'])
//        //.pipe(replace(/(window.endpoint\s?=\s?['"])(.+)(['"];?)/g, '$1https://api.cab9.co/$3'))
//        //.pipe(replace(/(<script src=")(.+)(signalr\/hubs"><\/script>)/g, '$1https://api.cab9.co/$3'))
//        .pipe(gulp.dest('track/'));

//    var op5 = gulp.src(['dist/track/index.html'])
//        //.pipe(replace(/(window.endpoint\s?=\s?['"])(.+)(['"];?)/g, '$1https://api.cab9.co/$3'))
//        .pipe(gulp.dest('dist/track'));

//    Array.prototype.push.apply(op, op1);
//    op.push(op2);
//    op.push(op3);
//    op.push(op4);
//    op.push(op5);
//    return es.merge(op);
//});

//gulp.task('replace-endpoint-test', function() {
//    gulp.src(['dist/login.html'])
//        .pipe(replace(/(window.endpoint\s?=\s?['"])(.+)(['"];?)/g, '$1https://api.cab9.co/$3'))
//        .pipe(replace(/(<script src=")(.+)(signalr\/hubs"><\/script>)/g, '$1https://api.cab9.co/$3'))
//        .pipe(gulp.dest('dist/'));

//    gulp.src(['login.html', 'print-reports.html'])
//        .pipe(replace(/(window.endpoint\s?=\s?['"])(.+)(['"];?)/g, '$1https://api.cab9.co/$3'))
//        .pipe(replace(/(<script src=")(.+)(signalr\/hubs"><\/script>)/g, '$1https://api.cab9.co/$3'))
//        .pipe(gulp.dest(''));

//    gulp.src(['track/index.html'])
//        .pipe(replace(/(window.endpoint\s?=\s?['"])(.+)(['"];?)/g, '$1https://api.cab9.co/$3'))
//        .pipe(replace(/(<script src=")(.+)(signalr\/hubs"><\/script>)/g, '$1https://api.cab9.co/$3'))
//        .pipe(gulp.dest('track/'));

//    gulp.src(['dist/track/index.html'])
//        .pipe(replace(/(window.endpoint\s?=\s?['"])(.+)(['"];?)/g, '$1https://api.cab9.co/$3'))
//        .pipe(replace(/(<script src=")(.+)(signalr\/hubs"><\/script>)/g, '$1https://api.cab9.co/$3'))
//        .pipe(gulp.dest('dist/track'));


//    for (var i = 0; i < modules.length; i++) {
//        gulp.src(['webapp/' + modules[i] + "/index.html"])
//            .pipe(replace(/(window.endpoint\s?=\s?['"])(.+)(['"];?)/g, '$1https://api.cab9.co/$3'))
//            .pipe(replace(/(<script src=")(.+)(signalr\/hubs"><\/script>)/g, '$1https://api.cab9.co/$3'))
//            .pipe(gulp.dest('dist/webapp/' + modules[i]));
//    }
//});

function getTasks(dest, endpoint) {
    return modules.map(function (module) {
        return gulp.src([dest + module + '/index.html'])
            .pipe(replace(/(window.endpoint\s?=\s?['"])(.+)(['"];?)/g, endpoint))
            .pipe(replace(/(window.appVersion\s?=\s?['"])(.+)(['"];?)/g, '$1' + ver + '$3'))
            .pipe(replace(/(<script src=")(.+)(signalr\/hubs"><\/script>)/g, endpoint))
            .pipe(gulp.dest(dest + module));
    });
}

function prependSlash(item) {
    return "/" + item;
}
