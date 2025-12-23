const axios = require('axios');

async function checkMetadata() {
    const url = 'https://w3s.link/ipfs/bafybeih5xpiob6xuw2fq5izx2krdyyjgogmd4ptmo6j4unn2ka3haranapa/metadata.json';
    console.log(`Fetching metadata from: ${url}`);
    try {
        const response = await axios.get(url);
        console.log('Metadata Content:');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.error('Error fetching metadata:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
        }
    }
}

checkMetadata();
