(function (window, angular) {
    var module = angular.module('cab9.invoices', [])

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('invoices')) return;

        $stateProvider.state('root.invoices', {
            url: '/invoices',
            searchText: 'invoices billing',
            searchName: 'Invoices',
            searchIcon: 'receipt',
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/management/invoicing/invoices/all/table.partial.html',
                    controller: 'InvoicesModuleTableController'
                }
            },
            permission: 'Invoices',
            resolve: {}
        });

        $stateProvider.state('root.creditnotes', {
            url: '/creditnotes',
            searchText: 'credit notes',
            searchName: 'Credit Notes',
            searchIcon: 'receipt',
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/management/invoicing/creditnotes/all/table.partial.html',
                    controller: 'CreditsModuleTableController'
                }
            },
            permission: 'Credit Notes',
            resolve: {}
        });

        if ($permissions.test('creditnotes.viewer')) {
            $stateProvider.state('root.creditnotes.viewer', {
                url: '/{Id:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
                permission: 'View Credit Note',
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/webapp/management/invoicing/creditnotes/item/creditnote-viewer.partial.html',
                        controller: 'CreditNoteItemEditController'
                    }
                },
                resolve: {
                    rCredit: ['Model', '$stateParams', function (Model, $stateParams) {
                        return Model.CreditNote
                            .query()
                            .include('Client')
                            .include('Tax')
                            .include('Tax/TaxComponents')
                            .where('Id', '==', "guid'" + $stateParams.Id + "'")
                            .trackingEnabled()
                            .execute();
                    }],
                    rTaxes: ['Model', function (Model) {
                        return Model.Tax
                            .query()
                            .include('TaxComponents')
                            .execute();
                    }]
                }
            });
        }


        if ($permissions.test('invoices.viewer')) {
            $stateProvider.state('root.invoices.viewer', {
                url: '/{Id:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
                permission: 'View Invoice',
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/webapp/management/invoicing/invoices/item/invoice-viewer.partial.html',
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
                            .where('InvoiceId', '==', "guid'" + $stateParams.Id + "'")
                            .trackingEnabled()
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

        if ($permissions.test('invoices', 'W')) {
            $stateProvider.state('root.invoices.create', {
                url: '/create',
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/webapp/management/invoicing/invoices/item/invoice-generate.partial.html',
                        controller: 'InvoiceItemCreateController'
                    }
                },
                params: {
                    data: null
                },
                resolve: {
                    rClients: ['Model', function (Model) {
                        return Model.Client
                            .query()
                            .select('Id,Name,AccountNo,ImageUrl,ClientType/Name')
                            .include('ClientType')
                            .parseAs(function (data) {
                                this.Id = data.Id;
                                this.Name = data.Name;
                                this.Description = data.ClientType.Name;
                                this.ImageUrl = window.formatImage(data.ImageUrl, data.Name);
                            })
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
            icon: 'receipt',
            title: 'Invoicing',
            subMenus: [
                {
                    state: 'root.invoices',
                    icon: 'receipt',
                    title: 'Invoices'
                },
                {
                    state: 'root.creditnotes',
                    icon: 'receipt',
                    title: 'Credit Notes'
                }
            ]
        });
    }

    moduleRun.$inject = [];

    function moduleRun() {

    }
})(window, angular);