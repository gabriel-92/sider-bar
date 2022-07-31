import {
    addDoc,
    collection,
    doc,
    getDoc,
    writeBatch,
} from "firebase/firestore";
import { db } from "../fireBase/config.js";
import Swal from "sweetalert2";
const saveOrder = (cart, orden) => {
    //Primer paso: abrir un batch
    const batch = writeBatch(db);

    //Array auxiliar que me define si hay productos fuera de stock
    const outOfStock = [];

    //Chequear el stock del producto en nuestra db y restarlo a la cantidad, si corresponde
    cart.forEach((productoEnCart) => {
        getDoc(doc(db, "products", productoEnCart.id)).then(
            async (documentSnapshot) => {
                //Generamos los datos del producto en tiempo real. Obtenemos el stock justo antes de guardar.
                const producto = {
                    ...documentSnapshot.data(),
                    id: documentSnapshot.id,
                };

                // Hacemos un update en caso que el stock supere a la cantidad.
                if (producto.stock >= productoEnCart.cantidad) {
                    batch.update(doc(db, "products", producto.id), {
                        stock: producto.stock - productoEnCart.cantidad,
                    });
                } else {
                    outOfStock.push(producto);
                }
                console.log("Products out of stock:");
                console.log(outOfStock);

                if (outOfStock.length === 0) {
                    addDoc(collection(db, "orders"), orden)
                        .then(({ id }) => {
                            //Recién hacemos el commit una vez que se genera la order
                            batch.commit().then(() => {
                                Swal.fire(
                                    "Order saved!",
                                    "Your order has been saved successfully with number of order: " + id,
                                    "success"
                                );
                            });
                        })
                        .catch((err) => {
                            console.log(`Error: ${err.message}`);
                        });
                    //Si tenemos productos fuera de stock al momento de generar la order avisamos al usuario
                } else {
                    let mensaje = "";
                    for (const producto of outOfStock) {
                        mensaje += `${producto.title}`;
                    }
                    alert(`Products out of stock: ${mensaje}`);
                }
            }
        );
    });
};

export default saveOrder;
