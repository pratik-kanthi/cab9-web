(function(angular) {
    var app = angular.module('cab9.models');
    app.config(appConfig);
    appConfig.$inject = ['ModelProvider'];
    var currencyIcon = '£';

    function appConfig(ModelProvider) {
        ModelProvider.registerSchema('DriverPayment', 'api/DriverPayments', {
            Id: {
                type: String,
                editable: false,
                hidden: true
            },
            TenantId: {
                type: String,
                editable: false,
                hidden: true
            },
            DriverId: {
                type: String,
                displayField: 'Driver._Fullname',
                table: {
                    hidden: true
                },
                display: 'Driver'
            },
            Driver: {
                type: 'Driver',
                ref: 'Driver',
                refBy: 'DriverId',
                table: {
                    hidden: true
                }
            },
            Status: {
                type: String,
                enum: ['Unsent', 'Unpaid', 'Paid']
            },
            _Driver: {
                type: String,
                calculated: function() {
                    return ((this.Driver) ? (this.Driver.Firstname + ' ' + this.Driver.Surname + ' (' + this.Driver.Callsign + ')') : '');
                },
                display: 'Driver'
            },
            PaymentFrom: {
                type: moment,
                display: 'Payment From',
                displayFilters: " | companyDate:'DD/MM/YYYY'",
                table: {
                    hidden: true
                }
            },
            PaymentTo: {
                type: moment,
                display: 'Payment To',
                displayFilters: " | companyDate:'DD/MM/YYYY'"
            },
            PaymentModelId: {
                type: String,
                displayField: 'PaymentModel.Name',
                table: {
                    hidden: true
                },
                display: 'Payment Model'
            },
            PaymentModel: {
                type: 'DriverPaymentModel',
                ref: 'DriverPaymentModel',
                refBy: 'PaymentModelId',
                table: {
                    hidden: true
                }
            },
            _PaymentModel: {
                type: String,
                display: 'Payment Model',
                calculated: function() {
                    return (this.PaymentModel ? this.PaymentModel.Name : '');
                }
            },
            _InvoiceCost: {
                type: Number,
                display: 'Invoice Cost',
                calculated: function() {
                    return (this.Invoice ? this.Invoice.TotalAmount : 0);
                },
                binding: function(item) {
                    return currencyIcon + item._InvoiceCost.toFixed(2);
                }
            },
            _BillValue: {
                type: Number,
                display: 'Bill Amount',
                calculated: function() {
                    return (this.Bill ? this.Bill.TotalAmount : 0);
                },
                binding: function(item) {
                    return currencyIcon + item._BillValue.toFixed(2);
                }
            },
            InvoiceId: {
                type: String,
                displayField: 'Invoice.Reference',
                table: {
                    hidden: true
                },
                display: 'Invoice'
            },
            Invoice: {
                type: 'Invoice',
                ref: 'Invoice',
                refBy: 'InvoiceId',
                table: {
                    hidden: true
                }
            },
            BillId: {
                type: String,
                displayField: 'Bill.Reference',
                table: {
                    hidden: true
                },
                display: 'Bill'
            },
            Bill: {
                type: 'Bill',
                ref: 'Bill',
                refBy: 'BillId',
                table: {
                    hidden: true
                }
            },
            BonusAmount: {
                type: Number,
                binding: function (item) {
                    return currencyIcon + item.BonusAmount.toFixed(2);
                }
            },
            Balance: {
                type: Number,
                calculated: function () {
                    var item = this;
                    return (item.BonusAmount + item.Bill.TotalAmount - item.Invoice.TotalAmount - item.Bill.PaymentsTotal + item.Invoice.PaymentsTotal)
                },
                binding: function (item) {
                    return currencyIcon + (item.BonusAmount + item.Bill.TotalAmount - item.Invoice.TotalAmount - item.Bill.PaymentsTotal + item.Invoice.PaymentsTotal).toFixed(2);
                }
            },
            Bookings: {
                type: ['Booking'],
                ref: 'Booking',
                refType: 'OneToMany',
                table: {
                    hidden: true
                }
            },
            Adjustments: {
                type: ['DriverPaymentAdjustment'],
                ref: 'DriverPaymentAdjustment',
                refType: 'OneToMany',
                table: {
                    hidden: true
                }
            },
            CreationTime: {
                type: moment,
                display: 'Creation Date',
                displayFilters: " | companyDate:'DD/MM/YYYY'"
            },
            ModificationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            CreationUserId: {
                type: String,
                table: {
                    hidden: true
                }
            },
            ModificationTime: {
                type: moment,
                display: 'Modification Time',
                table: {
                    hidden: true
                }
            }
        });
    }
})(angular);