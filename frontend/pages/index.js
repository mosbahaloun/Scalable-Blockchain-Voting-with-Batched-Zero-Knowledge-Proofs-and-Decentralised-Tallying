
 import Script from "next/script";
import Interface from '../components/Interface.js';


// import Admin from '../components/admin.js';

const Index = () => {
    return (
        <div>
            {/* <link rel="stylesheet" href="/css/bootstrap.min.css"></link> */}
            <Script src="/js/snarkjs.min.js" />
            <Interface />
            {/* <Admin /> */}
        </div>
    )
};

export default Index;