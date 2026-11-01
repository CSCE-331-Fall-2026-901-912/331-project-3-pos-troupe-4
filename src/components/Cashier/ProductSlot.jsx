import './ProductSlot.css';
/**
 * 
 * Resusable product tile 
 * product: the item pulled from getMenuItems()
 * onSelect: called when the product is selected this is used when customizing
 */


export default function ProductSlot({product, OnSelect}){
	const isBlank = !product;

	function handleClick(){
		if(isBlank){
			return;
		}
		onSelect?.(product);
	}


return(
	<button
	type = "button"
	className={`product-slot${isBlank ? ' product-slot--blank' :''}`}
	onClick = {handleClick}
	title = {product?.name}
	>
	{!isBlank && (
		<>
		<span className = "product-slot__name">{product.name} </span>
		<span className = "product-slot__price">
			${Number(product.price).toFixed(2)}
			</span>
		</>
	)}
	</button>
	);


}