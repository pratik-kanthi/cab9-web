(function (window, angular) {
    var module = angular.module('cab9.client.invoices', [])

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('invoices')) return;

        $stateProvider.state('root.invoices', {
            url: '/invoices',
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/client/invoices/all/table.partial.html',
                    controller: 'InvoicesModuleTableController'
                }
            },
            permission: 'Invoices Module',
            resolve: {
                rInvoices: ['Model', 'Auth', function (Model, Auth) {
                    var clientId = Auth.getSession().Claims.ClientId ? Auth.getSession().Claims.ClientId[0] : null;
                    return Model.Invoice.query()
                        .include('Client,Payments')
                        .filter('InvoiceType', 'eq', "'Client'")
                        .filter('ClientId', '==', "guid'" + clientId + "'")
                        .filter('CreationTime', 'ge', "datetimeoffset'" + new moment().startOf('month').format() + "'")
                        .filter('CreationTime', 'le', "datetimeoffset'" + new moment().endOf('month').format() + "'")
                        .execute();
                }]
            }
        });

        if ($permissions.test('invoices.viewer')) {
            $stateProvider.state('root.invoices.viewer', {
                url: '/{Id:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
                permission: 'View Invoice',
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/webapp/client/invoices/item/invoice-viewer.partial.html',
                        controller: 'InvoiceItemEditController'
                    }
                },
                resolve: {
                    rInvoice: ['Model', '$stateParams', function (Model, $stateParams) {
                        return Model.Invoice
                            .query()
                            .include('Client')
                            .where('Id', '==', "guid'" + $stateParams.Id + "'")
                            .trackingEnabled()
                            .execute();
                    }],
                    rAdjustments: ['Model', '$stateParams', 'rInvoice', function (Model, $stateParams, rInvoice) {
                        return Model.ClientInvoiceAdjustment
                            .query()
                            .where('InvoiceId', '==', "guid'" + $stateParams.Id + "'")
                            .include('ClientAdjustment')
                            .include('ClientPricingModelAdjustment')
                            .trackingEnabled()
                            .execute().then(function (item) {
                                rInvoice[0].Adjustments = item;
                            });
                    }],
                    InvoiceDetails: ['Model', '$stateParams', 'rInvoice', function (Model, $stateParams, rInvoice) {
                        return Model.InvoiceDetail
                            .query()
                            .include('Tax/TaxComponents')
                            .where('InvoiceId', '==', "guid'" + $stateParams.Id + "'")
                            .trackingEnabled()
                            .execute().then(function (item) {
                                rInvoice[0].InvoiceDetails = item;
                            });
                    }],
                    rBookings: ['Model', '$stateParams', 'rInvoice', function (Model, $stateParams, rInvoice) {
                        return Model.Booking
                            .query()
                            .include('LeadPassenger, Tax/TaxComponents, BookingStops, VehicleType, BookingExpense/BookingExpenseType, ClientStaff, BookingValidations/ClientReference')
                            .trackingEnabled()
                            .where('InvoiceId', '==', "guid'" + $stateParams.Id + "'")
                            .execute().then(function (bookings) {
                                rInvoice[0].Bookings = bookings;
                            });
                    }],
                    rPayments: ['Model', '$stateParams', function (Model, $stateParams) {
                        return Model.Payment
                            .query()
                            .where('InvoiceId', '==', "guid'" + $stateParams.Id + "'")
                            .execute();
                    }],
                    rTaxes: ['Model', function (Model) {
                        return Model.Tax
                            .query()
                            .include('TaxType')
                            .include('TaxComponents')
                            .execute();
                    }]
                }
            });
        }
        MenuServiceProvider.registerMenuItem({
            state: 'root.invoices',
            icon: 'receipt',
            title: 'Invoices'
        });

    }
    moduleRun.$inject = [];

    function moduleRun() {

    }
})(window, angular);