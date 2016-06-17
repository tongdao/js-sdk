define(function() {

	function TdOrder() {
	}

	TdOrder.prototype.setOrderId = function(id) {
		this['!order_id'] = id;
	};

	TdOrder.prototype.setCurrency = function(currency) {
		this['!currency'] = currency;
	};

	TdOrder.prototype.setTotal = function(total) {
		this['!total'] = total;
	};

	TdOrder.prototype.setRevenue = function(revenue) {
		this['!revenue'] = revenue;
	};

	TdOrder.prototype.setOrderLines = function(orderLines) {
		this['!order_lines'] = orderLines;
	};

	TdOrder.prototype.setShipping = function(shipping) {
		this['!shipping'] = shipping;
	};

	TdOrder.prototype.setTax = function(tax) {
		this['!tax'] = tax;
	};

	TdOrder.prototype.setDiscount = function(discount) {
		this['!discount'] = discount;
	};

	TdOrder.prototype.setCouponId = function(couponId) {
		this['!coupon_id'] = couponId;
	};

	return TdOrder;
});