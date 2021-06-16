(function (angular) {
    var module = angular.module('cab9.settings.exports', ['cab9.settings']);
    var currencyIcon = '£';
    module.config(moduleConfig);
    module.controller('ExportSettingsController', ExportSettingsController);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions', 'ModelProvider'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions, ModelProvider) {
        if (!$permissions.test('settings.exports')) return;
        $stateProvider.state('root.settings.exports', {
            url: '/exports',
            permission: 'Settings - Export',
            resolve: {
                rTabs: [
                    function () {
                        return [{
                            heading: 'SAGE - Drivers',
                            route: 'root.settings.exports.sagedriver'
                        }, {
                            heading: 'SAGE - Invoices',
                            route: 'root.settings.exports.sageinvoice'
                        }, {
                            heading: 'Invoice - Bookings',
                            route: 'root.settings.exports.invoicebookings'
                        }, {
                            heading: 'Payments - BACS',
                            route: 'root.settings.exports.bacs'
                        }, {
                            heading: 'Documents Export',
                            route: 'root.settings.exports.driverdocuments'
                        }, {
                            heading: 'Client Spend',
                            route: 'root.settings.exports.clientspend'
                        }, {
                            heading: 'FTP Invoice Generation',
                            route: 'root.settings.exports.invoicegen'
                        }, {
                            heading: 'PCO Driver Export',
                            route: 'root.settings.exports.drivers'
                        }, {
                            heading: 'PCO Vehicle Export',
                            route: 'root.settings.exports.vehicles'
                        }, {
                            heading: 'Capita - FASTER Export',
                            route: 'root.settings.exports.faster'
                        },{
                            heading: 'XERO - Invoices',
                            route: 'root.settings.exports.xeroinvoice'
                        },{
                            heading: 'XERO - Drivers',
                            route: 'root.settings.exports.xerodriver'
                        }]
                    }
                ]
            },
            views: {
                'settings-content@root.settings': {
                    templateUrl: '/webapp/management/settings/exports/partial.html',
                    controller: 'ExportSettingsController'
                }
            }
        });

        $stateProvider.state('root.settings.exports.sagedriver', {
            url: '/sagedriver',
            templateUrl: '/webapp/management/settings/exports/sagedriver/partial.html',
            controller: ['$scope', function ($scope) {
                $scope.report.preview = null;
                $scope.report.schema = 'SageDriverResults';
                $scope.report.params = {
                    SP: 'Sage_Driver_Export',
                    From: new moment().subtract(7, 'days').startOf('isoweek').toDate(),
                    To: new moment().subtract(7, 'days').endOf('isoweek').toDate()
                };
            }],
            resolve: {

            }
        });

        $stateProvider.state('root.settings.exports.invoicebookings', {
            url: '/invoicebookings',
            templateUrl: '/webapp/management/settings/exports/invoicebookings/partial.html',
            controller: ['$scope', function ($scope) {
                $scope.report.preview = null;
                $scope.report.schema = 'WilliamLeaResults';
                $scope.report.params = {
                    SP: 'Client_Invoice_Bookings',
                    InvoiceRef: ''
                };
            }],
            resolve: {

            }
        });

        $stateProvider.state('root.settings.exports.invoicegen', {
            url: '/invoicegen',
            templateUrl: '/webapp/management/settings/exports/invoicegen/partial.html',
            controller: ['$scope', '$http', function ($scope, $http) {
                $scope.report.params = {
                    SP: 'Invoice_Generation',
                    From: new moment().subtract(7, 'days').startOf('isoweek').toDate(),
                    To: new moment().subtract(7, 'days').endOf('isoweek').toDate()
                };
                $scope.showConfirm = function () {
                    var queryparts = [];
                    angular.forEach($scope.report.params, function (value, key) {
                        if (key == "From" || key == "To") {
                            queryparts.push(key + "=" + new moment(value).format("YYYY-MM-DDTHH:mm:ss") + 'Z');
                        } else {
                            queryparts.push(key + "=" + value);
                        }
                    });
                    $http.get($config.API_ENDPOINT + 'api/export/preview?' + queryparts.join('&')).then(function () {
                        swal('Success', 'Invoice Generation started, files will be available shortly.', 'success');
                    })
                }
            }],
            resolve: {

            }
        });

        $stateProvider.state('root.settings.exports.clientspend', {
            url: '/clientspend',
            templateUrl: '/webapp/management/settings/exports/clientspend/partial.html',
            controller: ['$scope', function ($scope) {
                $scope.report.preview = null;
                $scope.report.schema = 'ClientSpendReport';
                $scope.report.params = {
                    SP: 'Client_Spend_Report',
                    From: new moment().subtract(7, 'days').startOf('isoweek').toDate(),
                    To: new moment().subtract(7, 'days').endOf('isoweek').toDate()
                };
            }]
        });

        $stateProvider.state('root.settings.exports.sageinvoice', {
            url: '/sageinvoice',
            templateUrl: '/webapp/management/settings/exports/sageinvoice/partial.html',
            controller: ['$scope', function ($scope) {
                $scope.report.preview = null;
                $scope.report.schema = 'SageInvoiceResults';
                $scope.report.params = {
                    SP: 'Sage_Invoice_Export',
                    From: new moment().subtract(7, 'days').startOf('isoweek').toDate(),
                    To: new moment().subtract(7, 'days').endOf('isoweek').toDate()
                };
            }],
            resolve: {

            }
        });

        $stateProvider.state('root.settings.exports.xeroinvoice', {
            url: '/xeroinvoice',
            templateUrl: '/webapp/management/settings/exports/xeroinvoice/partial.html',
            controller: ['$scope', function ($scope) {
                $scope.report.preview = null;
                $scope.report.schema = 'XeroInvoiceResults';
                $scope.report.params = {
                    SP: 'Xero_Invoice_Export',
                    From: new moment().subtract(7, 'days').startOf('isoweek').toDate(),
                    To: new moment().subtract(7, 'days').endOf('isoweek').toDate()
                };
            }],
            resolve: {

            }
        });

        $stateProvider.state('root.settings.exports.xerodriver', {
            url: '/xerodriver',
            templateUrl: '/webapp/management/settings/exports/xerodriver/partial.html',
            controller: ['$scope', function ($scope) {
                $scope.report.preview = null;
                $scope.report.schema = 'XeroDriverResults';
                $scope.report.params = {
                    SP: 'Xero_Driver_Export',
                    From: new moment().subtract(7, 'days').startOf('isoweek').toDate(),
                    To: new moment().subtract(7, 'days').endOf('isoweek').toDate()
                };
            }],
            resolve: {

            }
        });


        $stateProvider.state('root.settings.exports.bacs', {
            url: '/bacs',
            templateUrl: '/webapp/management/settings/exports/bacs/partial.html',
            controller: ['$scope', function ($scope) {
                $scope.report.preview = null;
                $scope.report.schema = 'BacsResults';
                $scope.report.params = {
                    SP: 'Bacs_Export',
                    From: new moment().startOf('isoweek').toDate(),
                    To: new moment().endOf('isoweek').toDate()
                };
            }],
            resolve: {

            }
        });

        $stateProvider.state('root.settings.exports.capita', {
            url: '/capita',
            templateUrl: '/webapp/management/settings/exports/capita_bacs/partial.html',
            controller: ['$scope', function ($scope) {
                $scope.report.preview = null;
                $scope.report.schema = 'CapitaResults';
                $scope.report.params = {
                    SP: 'Capita_Bacs_Export',
                    From: new moment().startOf('isoweek').toDate(),
                    To: new moment().endOf('isoweek').toDate()
                };
            }],
            resolve: {

            }
        });

        $stateProvider.state('root.settings.exports.faster', {
            url: '/faster',
            templateUrl: '/webapp/management/settings/exports/capita_faster/partial.html',
            controller: ['$scope', function ($scope) {
                $scope.report.preview = null;
                $scope.report.schema = 'CapitaResults';
                $scope.report.params = {
                    SP: 'Capita_Faster_Export',
                    From: new moment().startOf('isoweek').toDate(),
                    To: new moment().endOf('isoweek').toDate()
                };
            }],
            resolve: {

            }
        });

        $stateProvider.state('root.settings.exports.driverdocuments', {
            url: '/driverdocuments',
            templateUrl: '/webapp/management/settings/exports/driverdocuments/partial.html',
            controller: ['$scope', function ($scope) {
                $scope.report.preview = null;
                $scope.report.schema = 'DriverDocumentResults';
                $scope.report.params = {
                    SP: 'Driver_Exp_Report',
                    From: new moment().startOf('isoweek').toDate(),
                    To: new moment().endOf('isoweek').toDate(),
                    AllDrivers: false
                };
            }],
            resolve: {

            }
        });

        $stateProvider.state('root.settings.exports.drivers', {
            url: '/drivers',
            templateUrl: '/webapp/management/settings/exports/drivers/partial.html',
            controller: ['$scope', function ($scope) {
                $scope.report.preview = null;
                $scope.report.schema = 'DriverPcoExport';
                $scope.report.params = {
                    SP: 'Driver_PCO_Report',
                    From: new moment().startOf('isoweek').toDate(),
                    To: new moment().endOf('isoweek').toDate(),
                    AllDrivers: false
                };
            }],
            resolve: {

            }
        });

        $stateProvider.state('root.settings.exports.vehicles', {
            url: '/vehicles',
            templateUrl: '/webapp/management/settings/exports/vehicles/partial.html',
            controller: ['$scope', function ($scope) {
                $scope.report.preview = null;
                $scope.report.schema = 'VehiclePcoExport';
                $scope.report.params = {
                    SP: 'Vehicle_PCO_Report',
                    From: new moment().startOf('isoweek').toDate(),
                    To: new moment().endOf('isoweek').toDate(),
                    AllDrivers: false
                };
            }],
            resolve: {

            }
        });

        ModelProvider.registerSchema('ReportParams', '', {
            From: {
                type: moment,
                required: true
            },
            To: {
                type: moment,
                required: true
            },
            InvoiceRef: {
                type: String,
                required: true,
                placeholder: 'INV000000'
            },
            AccountName: {
                type: String,
                display: 'Sending Account Name',
                required: true,
                placeholder: 'Account Name'
            },
            AllDrivers: {
                type: Boolean,
                helpText: 'All drivers or only those who worked during this time?',
            }
        });

        ModelProvider.registerSchema('WilliamLeaResults', '', {
            OB10Number: {
                type: String
            },
            Cost_Centre: {
                type: String
            },
            PO_Number: {
                type: String
            },
            Tax_Point: {
                type: String
            },
            Inv_No: {
                type: Number
            },
            Qty: {
                type: Number
            },
            Each: {
                type: String
            },
            Docket: {
                type: String
            },
            Date: {
                type: String
            },
            Time: {
                type: String
            },
            Bookers_name: {
                type: String
            },
            Ref1: {
                type: String
            },
            Ref2: {
                type: String
            },
            Ref3: {
                type: String
            },
            From: {
                type: String
            },
            To: {
                type: String
            },
            Tariff: {
                type: String
            },
            Net: {
                type: Number
            },
            Wait: {
                type: String
            },
            WT_Cost: {
                type: Number
            },
            Extras: {
                type: String
            },
            SubTotal: {
                type: Number
            },
            VAT: {
                type: Number
            },
            Total: {
                type: Number
            }
        });

        ModelProvider.registerSchema('SageDriverResults', '', {
            TypeCode: { type: String },
            SupplierNo: { type: String },
            NominalCode: { type: String },
            Code: { type: String },
            TaxDate: { type: String },
            Callsign: { type: String },
            Type: { type: String },
            NetAmount: { type: Number },
            TaxCode: { type: String },
            TaxAmount: { type: Number }
        });

        ModelProvider.registerSchema('ClientSpendReport', '', {
            AccountNo: { type: String },
            Name: { type: String },
            Count: { type: Number },
            Total: {
                type: Number,
                binding: function (item) {
                    return currencyIcon + item.Total.toFixed(2);
                },
            },

        });

        ModelProvider.registerSchema('SageInvoiceResults', '', {
            TypeCode: { type: String },
            AccountNo: { type: String },
            NominalCode: { type: String },
            Code: { type: String },
            TaxDate: { type: String },
            Reference: { type: String },
            Type: { type: String },
            NetAmount: { type: Number },
            TaxCode: { type: String },
            TaxAmount: { type: Number }
        });

        ModelProvider.registerSchema('XeroInvoiceResults', '', {
            ContactName: { type: String },
            EmailAddress: { type: String },
            POAddressLine1: { type: String },
            POAddressLine2: { type: String },
            POAddressLine3: { type: String },
            POAddressLine4: { type: String },
            POCity: { type: String },
            PORegion: { type: String },
            POPostalCode: { type: String },
            POCountry: { type: String },
            InvoiceNumber: { type: String },
            Reference: { type: String },
            InvoiceDate: { type: String },
            DueDate: { type: String },
            Total: { type: Number },
            InventoryItemCode: { type: String },
            Description: { type: String },
            Quantity: { type: Number },
            UnitAmount: { type: Number },
            Discount: {type: Number},
            AccountCode: { type: String },
            TaxType: { type: String },
            TaxAmount: { type: Number },
            TrackingName1: { type: String },
            TrackingOption1: { type: String },
            TrackingName2: { type: String },
            TrackingOption2: { type: String },
            Currency: { type: String },
            BrandingTheme: { type: String },
        });


        ModelProvider.registerSchema('XeroDriverResults', '', {
            ContactName: { type: String },
            EmailAddress: { type: String },
            POAddressLine1: { type: String },
            POAddressLine2: { type: String },
            POAddressLine3: { type: String },
            POAddressLine4: { type: String },
            POCity: { type: String },
            PORegion: { type: String },
            POPostalCode: { type: String },
            POCountry: { type: String },
            InvoiceNumber: { type: String },
            Reference: { type: String },
            InvoiceDate: { type: String },
            DueDate: { type: String },
            Total: { type: Number },
            InventoryItemCode: { type: String },
            Description: { type: String },
            Quantity: { type: Number },
            UnitAmount: { type: Number },
            Discount: {type: Number},
            AccountCode: { type: String },
            TaxType: { type: String },
            TaxAmount: { type: Number },
            TrackingName1: { type: String },
            TrackingOption1: { type: String },
            TrackingName2: { type: String },
            TrackingOption2: { type: String },
            Currency: { type: String },
            BrandingTheme: { type: String },
        });

        ModelProvider.registerSchema('BacsResults', '', {
            BankSortCode: { type: String },
            BankName: { type: String },
            BankAC: { type: String },
            Amount: { type: Number },
            Code: { type: String },
            SubCode: { type: String }
        });

        ModelProvider.registerSchema('DriverDocumentResults', '', {
            Callsign: { type: String },
            Firstname: { type: String },
            Surname: { type: String },
            DrivingLicenseNumber: { type: String },
            DrivingLicenseExpiry: { type: String },
            DriverPCONumber: { type: String },
            DriverPCOExpiry: { type: String },
            DriverNationalInsuranceNumber: { type: String },
            VehicleDescription: { type: String },
            Registration: { type: String },
            VehicleV5Expiry: { type: String },
            VehiclePCOExpiry: { type: String },
            VehicleMOTExpiry: { type: String },
            VehicleInsuranceExpiry: { type: String },
        });

        ModelProvider.registerSchema('DriverPcoExport', '', {
            PrivateHireLicenceNumber: { type: String },
            Firstname: { type: String },
            Surname: { type: String }
        });

        ModelProvider.registerSchema('VehiclePcoExport', '', {
            PrivateHireLicenceNumber: { type: String },
            Make: { type: String },
            Registration: { type: String }
        });


        ModelProvider.registerSchema('CapitaResults', '', {
            Value: { type: String }
        })
    }

    ExportSettingsController.$inject = ['$scope', 'rTabs', '$http', '$config', 'Auth'];

    function ExportSettingsController($scope, rTabs, $http, $config, Auth) {
        $scope.tabDefs = rTabs;
        $scope.report = {
            schema: '',
            params: null,
            preview: null
        }
        $scope.runReport = function () {
            $http.get($config.API_ENDPOINT + 'api/export/preview', {
                params: $scope.report.params
            }).success(function (data) {
                var idCounter = 1;
                $scope.report.preview = data.map(function (x) {
                    x.Id = idCounter++
                    return x;
                });
            })
        }

        $scope.downloadReport = function () {
            var session = Auth.getSession();
            var queryparts = [];
            angular.forEach($scope.report.params, function (value, key) {
                if (key == "From" || key == "To") {
                    queryparts.push(key + "=" + new moment(value).format("YYYY-MM-DDTHH:mm:ss") + 'Z');
                } else {
                    queryparts.push(key + "=" + value);
                }
            });
            window.open($config.API_ENDPOINT + 'api/export/download?TenantId=' + session.TenantId + '&' + queryparts.join('&'));
        }
    }
}(angular));
