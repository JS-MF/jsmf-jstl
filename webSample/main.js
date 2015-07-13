var JSMF = require('../JSMF_Prototype');

Class = JSMF.Class;
Model = JSMF.Model;

var Invoice = new Model('Invoice');

var Product = Class.newInstance('Product');
Product.setAttribute('Id', Number);
Product.setAttribute('Name', String);
Product.setAttribute('Price', Number);

Invoice.setModellingElement(Product);


var Perishable = Class.newInstance('Perishable');
Perishable.setAttribute('ExpirationDate', Date)
Perishable.setSuperType(Product);

Invoice.setModellingElement(Perishable);

var Customer = Class.newInstance('Customer');
Customer.setAttribute('Id', Number);
Customer.setAttribute('FirstName', String);
Customer.setAttribute('LastName', String);
Customer.setAttribute('Address', String);
Customer.setAttribute('Phone', String);

Invoice.setModellingElement(Customer);

var OrderLine = Class.newInstance('OrderLine');
OrderLine.setAttribute('Quantity', Number);
OrderLine.setReference('Product', [Product, Perishable], 1);

Invoice.setModellingElement(OrderLine);

var Order = Class.newInstance('Order');
Order.setAttribute('Id', Number);
Order.setAttribute('Amount', Number);
Order.setAttribute('Date', Date);

Order.setReference('Customer', Customer, 1);
Order.setReference('Lines', OrderLine, -1);

Invoice.setModellingElement(Order);



var InvoiceModel = new Model('InvoiceModel');
InvoiceModel.setReferenceModel(Invoice);

var p1 = Product.newInstance('Plate');
p1.setId(1);
p1.setName('Plate');
p1.setPrice(10);
InvoiceModel.setModellingElement(p1);


var p2 = Perishable.newInstance('Pizza');

p2.setId(2);
p2.setName('Pizza');
p2.setPrice(5);
p2.setExpirationDate(new Date(2015, 11, 01, 0, 0, 0));
InvoiceModel.setModellingElement(p2);

var c1 = Customer.newInstance('c1');
c1.setId(1);
c1.setFirstName('Jean-Sébastien');
c1.setLastName('Sottet');
c1.setAddress('5, avenue des Hauts-Fourneaux, Esch-Belval');
c1.setPhone('+3524259911');
InvoiceModel.setModellingElement(c1);

var o1 = Order.newInstance('o1');
o1.setId(1);
o1.setAmount(20);
o1.setDate(new Date());
o1.setCustomer(c1);
InvoiceModel.setModellingElement(o1);

var l1 = OrderLine.newInstance('l1');
l1.setProduct(p1);
l1.setQuantity(1);
InvoiceModel.setModellingElement(l1);

var l2 = OrderLine.newInstance('l2');
l2.setProduct(p2);
l2.setQuantity(2);

o1.setLines(l1);
o1.setLines(l2);
InvoiceModel.setModellingElement(l2);


// update form

$(document).ready(function() {

	$("#logo").remove();
	$('#address').append(c1.Address + "\nPhone: " + c1.Phone);
	$('#customer-title').append(c1.FirstName + ' ' + c1.LastName);
	$('#date').append(o1.Date.toDateString());
	$('.due').append('$'+o1.Amount);

	var lines = [l1, l2];
	for (var i=0; i<lines.length; i++) {
		var item = lines[i];
		console.log(item);
		var row = `<tr class="item-row">
			      <td class="item-name"><div class="delete-wpr"><textarea>${item.Product[0].Name}</textarea><a class="delete" href="javascript:;" title="Remove row">X</a></div></td>
			      <td class="description"><textarea></textarea></td>
			      <td><textarea class="cost">${item.Product[0].Price}</textarea></td>
			      <td><textarea class="qty">${item.Quantity}</textarea></td>
			      <td><span class="price">$ ${item.Product[0].Price * item.Quantity}</span></td>
			  	  </tr>`;
		$('#tableHeader').after(row);
	}
	update_total();
});
console.log(InvoiceModel);
