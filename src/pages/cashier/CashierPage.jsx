import {useEffect, useState} from 'react';
import { useNavigate } from 'react-router-dom';	
import { getMenuItems } from '../../api';
import ProductSlot from '../../components/Cashier/ProductSlot';


//Picking a drink and opening the customization page when clicked on.
export default function CashierPage() {
	const [menu, setMenu] = useState([]);
	const [search, setSearch] = useState([]);
	const navigate = useNavigate();
	const {items, removeItem,  clearCart, customerName, setCustomerName, subtotal, tax, total} = useCart();


	useEffect(() => {
		async function loadMenu(){
			try{
				const data = await getMenuItems();
				setMenu(data);
			}catch(error){
				console.error('Error loading menu: ', error);
			}
		}
		loadMenu();
	}, []);

	//search box
	const shown = menu.filter((product) => 
	product.name.toLowerCase().includes(search.toLowerCase())
	);

	function handleSelect(product){
		navigate('CustomizationPage', {state: {product: product}});
	}


    return (
		<div className = "cashier">
			<section className="cashier__left">
				<input
				className="cashier__search"
				placeholder="Search menu items..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				/>

			<div className="cashier__grid">
				{shown.map((product) => (
					<ProductSlot key = {product.name} product={product} OnSelect={handleSelect} />
				))}
			</div>
			</section>
			
		<aside className="cashier__order">
			<h3>Current Order</h3>
			<label>
				Customer:{' '}
				<input
					value={customerName}
					placeholder="Guest"
					onChange={(e) => setCustomerName(e.target.value)}
				/>
			</label>

		<div className="cashier__cart"></div>
		{item.loadMenu === 0 &&(
			<p className = "none"> Cart is Empty. <br /> Click drinks to customize.</p>
		)}
		{items.map((item, index) => (
			<div key ={index} className="cashier__cart-row">
				<span>{item.productName}</span>
				<span>${item.itemTotal.toFixed(2)}</span>
				<button onClick={() => removeItem(index)}>x</button>
			</div>
		))}
		
		<div className="cashier__totals">
			<div><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
			<div><span>Tax (8.25%):</span><span>${tax.toFixed(2)}</span></div>
			<div className="cashier__grand"><span>Total:</span><span>${total.toFixed(2)}</span>
			
			</div>
		</div>

 		<div className="cashier__actions">
          <button className="btn btn--danger" onClick={clearCart}>Clear</button>
          <button className="btn btn--green" onClick={() => navigate('/cashier/cart')}>
            Review &amp; Checkout
          </button>
        </div>

		</aside>

		</div>

    );
}