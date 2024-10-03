import Queue from "bull";
import Lead from "../models/leadSchema";
import Product from "../models/productSchema";

const coordinateQueue = new Queue('coordinate-update');

interface LocationTypes {
    client: string,
    city: string,
    state: string,
    zipCode: string
}

coordinateQueue.process(async (job) => {
    const { client, city, state, zipCode, products } = job.data;
    const data = {
        client,
        city,
        state,
        zipCode,
        
    }
    const coordinates = await fetchCoordinates(data);
    if(!coordinates)  return;
    await updateLead(job.data._id, coordinates as number[], products as string);
    return coordinates;
})

async function fetchCoordinates({client, city, state, zipCode }: LocationTypes) {
    try {

        const googleData = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${client}, ${city}, ${state}, ${zipCode}&key=${process.env.GOOGLE_MAP_KEY}`
        );
      
        const apiResponseData = await googleData.json();
    
        let location;
        if (apiResponseData.status === "OK") {
          const coordinates = apiResponseData.results[0].geometry.location;
          location = Object.values(coordinates).reverse();
        }
        return location;
    } catch(e) {
        return null;
    }
}

async function updateLead(id: string, coordinates: number[], products: string) {
    if (!coordinates) return;

    const productArr = products.split(",");
    const productList = await Product.find({ name: { $in: productArr } }).select('_id name');

    const idMap = new Map(productList.map(product => [product.name, product._id]));

    const idsArr = productArr.map(name => ({
        productId: idMap.get(name) || null
    }));

    console.log('Updating', id);
    await Lead.findByIdAndUpdate(id, { 
        cordinates: coordinates, 
        products: idsArr.filter(item => item.productId !== null)  
    });

    return;
}
export default coordinateQueue;