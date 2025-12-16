// SPDX-License-Identifier: GPL-3.0
/*
    Copyright 2021 0KIMS association.

    This file is generated with [snarkJS](https://github.com/iden3/snarkjs).

    snarkJS is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    snarkJS is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with snarkJS. If not, see <https://www.gnu.org/licenses/>.
*/

pragma solidity >=0.7.0 <0.9.0;

contract Groth16Verifier {
    // Scalar field size
    uint256 constant r    = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Base field size
    uint256 constant q   = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    // Verification Key data
    uint256 constant alphax  = 11343753462176379533412892702502248496123709536233455723533660683229873347743;
    uint256 constant alphay  = 18931720325921289944261284601860491761822994499628322583601168991863757536333;
    uint256 constant betax1  = 8041234401900373791568972768797922435768766159070050031629667960200768625985;
    uint256 constant betax2  = 14841573471177137248329031525493100057650223999129844293899722745582363729928;
    uint256 constant betay1  = 17694718295073937965346135925027900043542561721245802636742257591433463505199;
    uint256 constant betay2  = 15730145096954962076154988805320747661825752211760364928483393893241442045605;
    uint256 constant gammax1 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax1 = 14737733875449724285039306531687783875828114094146592243125825769111334281524;
    uint256 constant deltax2 = 6590834813819970493777915143724051423687015325628517140793355227683035894339;
    uint256 constant deltay1 = 1565325029583952239575930040563504195511645399616271642322969811280633075157;
    uint256 constant deltay2 = 7355244789163209947925816037130480211586608441065755875466069348543072079526;

    
    uint256 constant IC0x = 20247893566963844548626953774912706599566314251623278478238091526934144468554;
    uint256 constant IC0y = 3862969768188679907884310852880793370252944386354404518295660163117592087475;
    
    uint256 constant IC1x = 3652120134862179403476432378822523695444912012849203315753374605884248527464;
    uint256 constant IC1y = 13296890136847924541851652503548922439910489611088425643614609295609431233008;
    
    uint256 constant IC2x = 20800808483040062454464646585843105398713818610547834939467865117716568696370;
    uint256 constant IC2y = 9123136183979594296245496950729011447166965690071172122888369892924072980272;
    
    uint256 constant IC3x = 20768817684608730214293971580852306519424880241846048636484269821684935143528;
    uint256 constant IC3y = 8956764979028694613406186361485063388881739042355103974764906234960039822174;
    
    uint256 constant IC4x = 4269916045161487981301904781741535379336208228344238484211496380651389162425;
    uint256 constant IC4y = 14762329048122293739075821117142723152631869862352831394278495929792767507441;
    
    uint256 constant IC5x = 18434010418693435960007624178908494990919544180667376375354862178622355614793;
    uint256 constant IC5y = 8037958310238138080749860543527887065910285745937091538067292950641860714077;
    
    uint256 constant IC6x = 3929597199491998781436164997523813284010777585737016171285522664938349227117;
    uint256 constant IC6y = 3216644003435806158515363067088506980036741610924601637883693587088557193311;
    
    uint256 constant IC7x = 7209357978661690716788759920227954856779749583478813357814342993398114108044;
    uint256 constant IC7y = 113385317952414192009811597187564831040620682996521945646679345875144195589;
    
    uint256 constant IC8x = 3177424457166805060763803067356602181239285860056306657051719893363281008524;
    uint256 constant IC8y = 1322204797466256873900716059101916936679602295446342610087357657532015804967;
    
    uint256 constant IC9x = 10827119854162335689855546139564852781189312140292336385939328467027982578989;
    uint256 constant IC9y = 9531127155824424290175458734585161690535610934652113691167596843286506947656;
    
    uint256 constant IC10x = 14465983204493294455084106180040159748609626177437104931320526824611524510746;
    uint256 constant IC10y = 10714935706116369792973363006193257887132784169737840236497476464523698087771;
    
    uint256 constant IC11x = 9963539256948423058626609785214613371789529944196178509165442871127100618930;
    uint256 constant IC11y = 16139647094543961128563820083491743330068736064556525651094835694192359567681;
    
    uint256 constant IC12x = 13576015896749175940018859283027420969909497237754968371780669290207032618431;
    uint256 constant IC12y = 7618884794213154020314771394281092695529837574509510662371138839684469272464;
    
 
    // Memory data
    uint16 constant pVk = 0;
    uint16 constant pPairing = 128;

    uint16 constant pLastMem = 896;

    function verifyProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[12] calldata _pubSignals) public view returns (bool) {
        assembly {
            function checkField(v) {
                if iszero(lt(v, q)) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }
            
            // G1 function to multiply a G1 value(x,y) to value in an address
            function g1_mulAccC(pR, x, y, s) {
                let success
                let mIn := mload(0x40)
                mstore(mIn, x)
                mstore(add(mIn, 32), y)
                mstore(add(mIn, 64), s)

                success := staticcall(sub(gas(), 2000), 7, mIn, 96, mIn, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }

                mstore(add(mIn, 64), mload(pR))
                mstore(add(mIn, 96), mload(add(pR, 32)))

                success := staticcall(sub(gas(), 2000), 6, mIn, 128, pR, 64)

                if iszero(success) {
                    mstore(0, 0)
                    return(0, 0x20)
                }
            }

            function checkPairing(pA, pB, pC, pubSignals, pMem) -> isOk {
                let _pPairing := add(pMem, pPairing)
                let _pVk := add(pMem, pVk)

                mstore(_pVk, IC0x)
                mstore(add(_pVk, 32), IC0y)

                // Compute the linear combination vk_x
                
                g1_mulAccC(_pVk, IC1x, IC1y, calldataload(add(pubSignals, 0)))
                
                g1_mulAccC(_pVk, IC2x, IC2y, calldataload(add(pubSignals, 32)))
                
                g1_mulAccC(_pVk, IC3x, IC3y, calldataload(add(pubSignals, 64)))
                
                g1_mulAccC(_pVk, IC4x, IC4y, calldataload(add(pubSignals, 96)))
                
                g1_mulAccC(_pVk, IC5x, IC5y, calldataload(add(pubSignals, 128)))
                
                g1_mulAccC(_pVk, IC6x, IC6y, calldataload(add(pubSignals, 160)))
                
                g1_mulAccC(_pVk, IC7x, IC7y, calldataload(add(pubSignals, 192)))
                
                g1_mulAccC(_pVk, IC8x, IC8y, calldataload(add(pubSignals, 224)))
                
                g1_mulAccC(_pVk, IC9x, IC9y, calldataload(add(pubSignals, 256)))
                
                g1_mulAccC(_pVk, IC10x, IC10y, calldataload(add(pubSignals, 288)))
                
                g1_mulAccC(_pVk, IC11x, IC11y, calldataload(add(pubSignals, 320)))
                
                g1_mulAccC(_pVk, IC12x, IC12y, calldataload(add(pubSignals, 352)))
                

                // -A
                mstore(_pPairing, calldataload(pA))
                mstore(add(_pPairing, 32), mod(sub(q, calldataload(add(pA, 32))), q))

                // B
                mstore(add(_pPairing, 64), calldataload(pB))
                mstore(add(_pPairing, 96), calldataload(add(pB, 32)))
                mstore(add(_pPairing, 128), calldataload(add(pB, 64)))
                mstore(add(_pPairing, 160), calldataload(add(pB, 96)))

                // alpha1
                mstore(add(_pPairing, 192), alphax)
                mstore(add(_pPairing, 224), alphay)

                // beta2
                mstore(add(_pPairing, 256), betax1)
                mstore(add(_pPairing, 288), betax2)
                mstore(add(_pPairing, 320), betay1)
                mstore(add(_pPairing, 352), betay2)

                // vk_x
                mstore(add(_pPairing, 384), mload(add(pMem, pVk)))
                mstore(add(_pPairing, 416), mload(add(pMem, add(pVk, 32))))


                // gamma2
                mstore(add(_pPairing, 448), gammax1)
                mstore(add(_pPairing, 480), gammax2)
                mstore(add(_pPairing, 512), gammay1)
                mstore(add(_pPairing, 544), gammay2)

                // C
                mstore(add(_pPairing, 576), calldataload(pC))
                mstore(add(_pPairing, 608), calldataload(add(pC, 32)))

                // delta2
                mstore(add(_pPairing, 640), deltax1)
                mstore(add(_pPairing, 672), deltax2)
                mstore(add(_pPairing, 704), deltay1)
                mstore(add(_pPairing, 736), deltay2)


                let success := staticcall(sub(gas(), 2000), 8, _pPairing, 768, _pPairing, 0x20)

                isOk := and(success, mload(_pPairing))
            }

            let pMem := mload(0x40)
            mstore(0x40, add(pMem, pLastMem))

            // Validate that all evaluations ∈ F
            
            checkField(calldataload(add(_pubSignals, 0)))
            
            checkField(calldataload(add(_pubSignals, 32)))
            
            checkField(calldataload(add(_pubSignals, 64)))
            
            checkField(calldataload(add(_pubSignals, 96)))
            
            checkField(calldataload(add(_pubSignals, 128)))
            
            checkField(calldataload(add(_pubSignals, 160)))
            
            checkField(calldataload(add(_pubSignals, 192)))
            
            checkField(calldataload(add(_pubSignals, 224)))
            
            checkField(calldataload(add(_pubSignals, 256)))
            
            checkField(calldataload(add(_pubSignals, 288)))
            
            checkField(calldataload(add(_pubSignals, 320)))
            
            checkField(calldataload(add(_pubSignals, 352)))
            
            checkField(calldataload(add(_pubSignals, 384)))
            

            // Validate all evaluations
            let isValid := checkPairing(_pA, _pB, _pC, _pubSignals, pMem)

            mstore(0, isValid)
             return(0, 0x20)
         }
     }
 }
