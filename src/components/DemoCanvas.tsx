import { useEffect, useRef } from 'react';
import { canvasEngine } from '../engine/canvasEngine';
import { Canvas } from './Canvas';
import { ZoomControls } from './ZoomControls';
import { RecenterButton } from './RecenterButton';
import { PropertiesPanel } from './PropertiesPanel';
import { Lock } from 'lucide-react';

// ─────────────────────────────────────────────
// Dữ liệu workflow demo đã cập nhật từ file demo_workflow_1785078570786.json
// ─────────────────────────────────────────────
const DEMO_WORKFLOW_DATA = {
  nodes: [
    {
      id: 'node_1785078056303',
      type: 'input.image',
      position: { x: 1162.2627201274736, y: 673.4764450656319 },
      data: {
        file: 'data:image/png;base64,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',
        nodeName: 'input_image_1',
      },
    },
    {
      id: 'node_1785078086464',
      type: 'input.image',
      position: { x: 1166.7020087796937, y: 1046.4024361545624 },
      data: {
        file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAeUAAAICCAYAAADxmdXFAAAQAElEQVR4Aez9CaBtWVUeCn9jzrXW3vv0t++76guKogqKAkQRRVHUp3lq1Gc0iYkmJi8xpvlffElMfk18eWmMGlEEAtIjCAhKUyBYQBV9V1RRfXOr7q3bd6ff3Vprvu+b+6xzTxUFdkCde2uuu789+zHHHGuf+c0x59r7OqQrWSBZIFkgWSBZIFlgXVggkfK6uA1JiWSBZIFkgWSBZAHg4iTldGeTBZIFkgWSBZIFLkALJFK+AG9aUjlZIFkgWSBZ4OK0QCLlC+e+Jk2TBZIFkgWSBS5yCyRSvshvcBpeskCyQLJAssCFY4FEyhfOvbo4NU2jShZIFkgWSBZYtUAi5VVTpEiyQLJAskCyQLLAk2uBRMpPrv1T7xenBdKokgWSBZIF/koWSKT8VzJbapQskCyQLJAskCzw9bdAIuWvv02TxGSBi9MCaVTJAskC33ALJFL+hps4dZAskCyQLJAskCzwF7NAIuW/mJ1SrWSBZIGL0wJpVMkC68oCiZTX1e1IyiQLJAskCyQLPJUtkEj5qXz309iTBZIFLk4LpFFdsBZIpHzB3rqkeLJAskCyQLLAxWaBRMoX2x1N40kWSBZIFrg4LfCUGFUi5afEbU6DTBZIFkgWSBa4ECyQSPlCuEtJx2SBZIFkgWSBi9MCjxtVIuXHGSQlkwWSBZIFkgWSBZ4sCyRSfrIsn/pNFkgWSBZIFkgWeJwFLhJSftyoUjJZIFkgWSBZIFngArRAIuUL8KYllZMFkgWSBZIFLk4LJFJex/c1qZYskCyQLJAs8NSyQCLlp9b9TqNNFkgWSBZIFljHFkikvI5vzsWpWhpVskCyQLJAssBXs0Ai5a9mmZSfLJAskCyQLJAs8E22QCLlb7LBU3cXpwXSqJIFkgWSBb4eFkik/PWwYpKRLJAskCyQLJAs8HWwQCLlr4MRk4hkgYvTAmlUyQLJAt9sCyRS/mZbPPWXLJAskCyQLJAs8FUskEj5qxgmZScLJAtcnBZIo0oWWM8WSKS8nu9O0i1ZIFkgWSBZ4CllgUTKT6nbnQabLJAscHFaII3qYrFAIuWL5U6mcSQLJAskCyQLXPAWSKR8wd/CNIBkgWSBZIGL0wJPxVElUn4q3vU05mSBZIFkgWSBdWmBRMrr8rYkpZIFkgWSBZIFLk4LfO1RJVL+2vZJpckCyQLJAskCyQLfNAskUv6mmTp1lCyQLJAskCyQLPC1LXChkvLXHlUqTRa4CC0QQjDCrcCvhEor3y7CIachJQs85SyQSPkpd8vTgNerBUYke7gTzp2bWTzx0LZzxw7uP3z7555x8Eufet49n/rId9z2sZte+ukPv+eHP/GBd/2tT9z0hz/98Zve8dOf/9B7fuJLN7/vb95xywd/6I5PffglD3zxky949MtfeObJB++6/MyRB/bMzz+6KZw6NUnZBZGIe73e/KRXssCKBRIprxhiXQRJiaeEBUSORCHyPfXQPVc+8qXPvPi2j9z0Mzf/0Zv+w7t+/09e/vrX/d6bX/N7r3z7q37zf7zjzW963R++5Q2vfdvb3vLGN7/zbW9+3Xvf+dZX3vTH7/jtP33fe3/rw+9/z//8wJ/80e++993veMWfvOOtr3nPW9/yxne+6bVvfeubX/P2t77h99/x1t9/9dvf9ftv/MN3/clb33Dru9/6G7ff8sF/9cgXPvWjZx/48gu6Rx/aF86enaYeLSLNA0+JT14a5IVggfTHeCHcpaTjBW8BEl8W5h/ddPrh+66+49M3/+AH3/Gmf/G6N/zeb732Vb/z5je/9pVvfvdb3/LbH7npff/mtk9//O88fO9dLz13/Mi3Ls+ffdZg/tyV5eLcHvSXtudVublV1xvaIUwXVTUluHIw7cvhTFaVG2w42BL6vV3V4uJlvblzz1g+e/rGEw8/8B0P3nH7D33qlpv/0Qfe9Y7/+Pa3vO5Vf/D617z5nW990+v+6A9f/xufef/b/+Xdn/zwD565/86nBeonPS94Y6cBJAtcwBZIpHwB37wLRPWnpJokN3/q1D2TD3z+5ss+9u63fP/bfve//vvf/vVff8Pv/I//5w/+4LWvfNXHPvAnv3zv7Z/7yfmTx65fnjuzteotjmPYzQjU/SWE7iLq5XmEwRIw7MEN+0Q3puv+IsruPIbLcwiMg3VsuAwru+cxWAaJnEWzoGz4Yc+Ketiy/vLM0pmTew8/cN8L7/3S5376w+9597997x+++ZVvec3v/cHv/87L3vCuV/73f//J97ztB0/c8blLw/Hj4xxHmiOekp/gNOgnywLpD+7Jsnzq96K0QLjzzuKzN7/nmje/7L//3Vf+2v/4b69/1Wve9p53vu11n//krf/3yUMHX1rOz15ry4tb0F8a8/1eVi7NWdUl8ZJYXUniJbJ6iMIqdLyDr8oIVw0hZKFCjhot/uW2vaFAQFZXAMutHJDA+yTuXgRI5BNFDskKgy5JfIFkvsiyLrKyZ3kYZFnVGwu9xS39hdPPOHv08EsfuPOOX/r0Rz706j9651ve8Jo3/M6v3vyuN/7vD33h4/tIzv6ivGFpUMkC68wCbp3pk9RJFrgwLLBGyxA+l99996c3vf9tr/7W33rba3/pHW9602u/9NlP/7f+4tzfy6vqunaoNxWhyqzfRb28COv3SIpD+HqAiVaOsdwjsxCJFYM+6l4XFevUjBcASbVGhgo+1MiqCr4sI9xwCKvKCOULqpMbSNoObe+BwQCebUTebWeR6Fss92o3VNkAeTUg4fchfXzVz+mJb+7OnXvu4ulT/+cdn/vsyz78pze94t2vf8WPfumjHzgQ7r+/RYKmBCqWXskCyQJfdwskUv66mzQJfKpYIBw+3PniRz94+R/83kf+yR/+3itfdvNNH3jLiUcf+Tc85322Vf0Nw6WlfNhbNBFlS16vGciLyOjhZvRwQVId9vqoSL6oamSkuizLkGcO3vinSa+4JKlWgyFCWcHqAHG3A+WsAKwDes4msNBTrslzrksWDVmf7VjHCKzkKVRaegmO9RX6ukbOepnV9L4Hjq51C/3l7ctnT73k4D13/M4tN3/g1W/903f/60996F3ffuqee/RENzVGupIFkgW+jhZwX0dZSVSywFPCAvqK0Wc/+r7rX/W2V//qH73lta+7/RO3/OrCyeM/mg27u7NBr1X1FuIWsQ8lQI+04rbygORa0sMNtBD5FyUjluX0f+0xUH4dDIGkbC5j6Em3DhXzhJpkvBYBLEOA2pB+o6yabenNQgDLhRCMPTumPAk/W4VzBRxhtYerwwjU1xMcC6w3B9ebs6Jc2oSls99+7IEv/+vPf+T9r7rlQ3/432794zd+Tzh55wT7kXDKT69kgWSBv64F3F9XQGqfLPBUsQDJJ7vrUx+9/HV/8PJ//84/eMMb773ji7/ALern0xue4Jltpu3metiN28mO3mfNc94IeqB1BMkzhjVKbimXVYjEKcKkbFRMq14k5lgPq+UgncZ6NQl7BbI7ozAzKFRacgTFBcUbKH0e+tMnwghmRjmevRg8FwzS39OzHqPXXpDq86qPIlSk73KsXFq47PBD9/392z55yyv/16vf8ktfvuXDz2AfDulKFkgW+GtbIP0h/bVNmARc7BYg4djBg1+cefcb/9dPvuHVr/idj9/8sX+8eHb26v78YtFb5jnxytaytphrxum2RnLjbjIUFxR3MDiRH8AYQMaFmTFy/sW+mE1WXMlSWtEmVLzB+TzXZMGxqdUB5PQI1RHRg3kRqzVrxuqv6J+Z8aV2gbIG/SGPpYfodQfo9/tR59x51FWVLS8u7p49c/IXbv7Q+373z975+h8KBw/OxMbr7S3pkyxwAVng/F/zBaR0UjVZ4BthARKRIx7Dkkz7z374T254x6ve8Ksffu97fr2/tPji6XZnzJWltfMM8ijNLJIb69LbrSKpKi4yVCh8LX3NLBavrff4uNKPB1a83NiYb48v/1ppVl99mVnU38xGeZLLmNqbGUTC3jnUwxIDnoGTkFH4DGNFbm1XT86dOv4td3zuM7/10c/f/M/PHfxiImbaLr2SBf6qFkik/Fe1XGp3UViAxGMLx45t+V+v+I2/8V/+07/9p69/9W9fp4Ep/9She3a++Xd//Sfe9fa3v+yRB+/7e+O53xz6A9ebn4fnVnPoDWD0QAUyMaqyREXiit6yDo4Jec9g2EB1hSYt4q64lS0orvqC4sqjHlLnCaEyRwI17l03YVg5O1ZZgydqbGar2Wy+Gn98RGNSnvc+Erd0G/YHGJKcK3rOw6U5bBjPzVXLu7/46Vv/6Qff+55fPXTHrTewb692Cd8wCyTBF6kFEilfpDc2DevPtwCJI7/tUzd/y6/+2r/7H5+99daXL82e+//NnT79vBDub932sQ8+//d+87de8cXPfPY3y+XlG204HF88dw4ZAibaLYThAOWwH7dzKQciUYVr0WigPJF2k14bRoJmhplF0jN7bMgiNuU+siJElMWweSkdyKrC2rwm/rVC8beZPa7KypQgsmeZFgYi5pqLDdXMnI+ec2YOPMlGKzeg7MINByTm4YZjjxz8B7fe/MH/eeet7/m+xRMPbaN+OcFKj+smJZMFkgWe0ALuCXNTZrLARW4BEoX/4sdvfunvv+Ll//3Yw/f92Fhm24ZL8xs73r7l8x+645+/4y1v/J9zp09+DwbdTeXyEqbGxrB5ZhpVv4fe0iLamcdY3oKuwAPcQG/YkaYykXOdcmkTGEVyovMRM8ahOqaxRyoTPCs7bhNbGZQuQBeZqN6jHLH2lYf6opp8nVo0JAzCZUVuWCghJW2IuDHIFRqfh5sQ5ugqWNm1IZj7EygyNtwLoNf+WesqzH4ml0MShgJu8UBbJwcw4aJsdbC6TM3fvHTn/ytWz900+9+8eY/+Xe333rTP73zsx/70YN3f/ZFxx+465rjxx/YqoUP+/OEnVcixZ7yFkgGgEs2SBZ4KlrgS5/5zKWv+r3f/ReHHnrwhpmx8aI7N2sLZ0537v/y7T/x1je8/lfOnTj27NDv5R6w3Bv6JOL52XNkoQp5nqOqhuj3u7AAyEsWwMvMyMd60KpmnQra7tVWtTxOxVWvQSCRr8bJrCSo2JZiYqgyxb8W1OZ8+RPzm5nBbATVNTMFEeTxGEY5IlumzDhqTg1mFscgPcyMxOxgxrbUG7xybmkX9JzbRQFwoTFY6oLbB8hR+8Hi4oEzRx/94ds//6l/+6lbPvpfP/bB97/6pj9691vf/Y4/eMv73vLWl//x6z/0bz/2J2//2fs+f8sPHbrjCzecPfLg3jA7u4F65BSdXskCT1kLuKfsyNPAn7IWOPHQQ9ve9sbX/uJdX7r9+W3nsqrbxQSJZbLVQlbXGbeqi8LzT6Mcoh70IwI9S/JPJCbFSbcA65BE4GD0IQ0gWdU8H2Zs1fsFL9VhEF/arqZTGcvNDGYrILmL4EVuwto2amhmClZhZlEXT2J09K6xeqmeMMrQAss9TwAAEABJREFUtvZajHIB81lsD141AoIzWOaZT0plXjAgmAOcRw1DTcdaYBG899COQKNj4Pk6W7IW4pm6YzpDQM1dhaIOvmN1yw26U0unT2w99sB9T7/7i5/9oVtuev+/+uO3vvG/vumVv/eKV73sN97w6t/89df/wRte+YrPvv/tv3T0S5/53u7xhw+EcLjDPqiEek1IFrhgLfCXUjx94P9S5kqVL3QL6Gci3/D6V/3c5z/9iZ9oOSsmihba3sGLcYYDiIR1XiyPz6oSqMvotYYmJDmTKGKebNHEa21hhxDzm7hCoanThMoTQBJvCLgp+2qh+jIzBY/B2vqPKWDi8WWReCkjECwm2QLGsTuSelgRrTbgMqPiWGpw+GvGZWYwM+YijlN1G8JnNciEoaxQlSXP3EcLmqq/DMe0trcn2x7T44XNcO9/onAdkvWU9Xtb6+7CVeeOHfv2Oz77qb/5x2972y///it+542vf8XL3/KO33nbf7r95pt+4MRDd+hsetRx7D29JQtcvBZIpHzx3ts0siewwGceuW/fp2+95cfKfnea3IDxTis+uCQyGfb6KPsDND9rqaeoa25TR5B1RKTyKtei6cLsPGeYjeJmFre3bcULVqj6ZqZgFU2+SE6Za8O1cZWZjdrWDOStNxDhrkXNegLdWozAP3VnCOYx8n4d4y6SbNNO4xI5C6oTzJG4Het5NHXgHYSYtpEsOE85nt6/A2pDXGyQnAPJuB4MSNB95KHGeJ5hutPGzFgHU50cEy2PLAzQRokxHlB3rEJW9vPu7LlNjz704I133f6Ff/z2t7zxt1/9sv/5G2975f980SO336LtbXaCdCULXLQWuGA+4BftHUgD+6ZZgATnPnDTe19y+sTxy3Zu3eKuuPwS5NzGNTNU3HaOJCwyoQcbBHmLDRl/lfBrKc/+znuUlPVEabVXvsK1WJvXxBUKa+uZGZxzj4GZkSRHUJmxvPGIFZoZIIImxKFmFusrLpJXaGaRX2N979CEaid4bmELBg+BrB3rR/14vqwFTKAt5TWPMKAnPYS2tbUY6hS5vueMqbE2Ojyjd1ZTUkCn8Jgab5HAnbm6bBcIe0Nv8ON33fb51771TX/4sj9755t+6Ny59CMlSNdFawF30Y4sDSxZ4HEW+PwtH9h25223vXjr5pnO1o0z0H/8UNGDG/IMVKhJL8HkGTrIaxRCQ6Yi6cchkvhXIWuR0lpIzuPTytP5smhN4VqYWdRedRRpQsUbmBnMbJRUuAaBuUK9on/NMfIFoRmngX/+dIsDKIPjxgrMeYBQaFy0KC67qJ2guOqqvDbEhUck8xVblNzHrrTDELf8Ky54htDvfmvho3GYGbz30ANzLXrNkzOT2DQzjenJCYy1W2jRox7jDsb0+BgmO22Mt9tust3e01uY/5sf/fCf/vc3/vYrfu2zH3zHC/Qb5EhXssBFZgH+VV5kI7qghpOU/WZZgGRgd95+142tIr/h8gMH0CoclhfmSRgBA3p2IqsSgWQMEleIRBNJVA84kWzYHjHNOEjOxjbCE+mvuk2+o5cqKG1mMHsslL+2vtLC2rwmrlBQuWBmCqJM5T8RRIRDkmTJxYf0Vx01ci6DkXDJyZB+DUSW+p+qXOYjcZp3AD3qtTAzOsYjuJXxmZnE0n4hhnoTYa/tczWPVWvjwodhr7dMu5bIWgXGJscwNTWFqYlxFFlOtq8YOjjq7+va6GHnblhdcuj++//BTX/8/te9+tUv/78O3/aJXZKbkCxwsViAf3EXy1DSOJIFvqYFXDlc2rtz+9bpQa8bv+I0NTlJEuHcT3Ko6FFWwVCRvOTpyXMWgYlUyAkkjhoi4fjLWYF/NmQcYyjvdm2vZhZJ0mwUiswoFsJaz1ttzEhs7Fdx9bU2lFzBw6BQ5Q2w9qIqIMhxgD2OEA2gmtAVqABHQD1cBEi0q4TqHRxJ+PEQITd5nt5rE1d+BPUXicMDxr4F9ghB/bJL9oURwH4JrmcgcE2DwHRnfCL2PaxKyO6e29odkvLY2Bh0tDDUGT8RBiVa3mPj9JS+L57Vvd4lhx9+6B+/7e3v+g+33vTHT6dtMnacXskCF7wF+Od8wY8hDWCdWWA9qvPQQ5+fmJs9d2OoKzpcFrdO5+bOkUzIXCA5MqjrGtGrLEt60BWJmIQSQvSaOenHYSkU2ZixAXOUFlkrFCRjLeSpNtAWrtCkFarN1wK7WEOsQcmoj5nBzOCcW4XZKA+8zEZxeb0izqYei2I7hZJm3kWP2K2RE+OWxXqOoXc5hMwXEJzP4eRpsw/ZIsqinZpxa1xN3Gykh8aofEFltCzMDINBD8PhkPYexnF5byiKgmfLeQwXF+ZinaocoBzwTNocJknkE+PjlpvbePzo0b/zpzd94GXvectrf+D48ePj0iUhWeBCtoC7kJVPuicL/EUsQEKwuz/xxWuPHTrybSSobDAYgCGbOjqXJF+SMOi6OeZYWSODISNJKU8EEkG/ToTdYBAqlPQOS5JFzfPTwPNTMI99UQpQMt6APUCoWT/QQ41e5AqJqXLTJsZZrjqB/dckrSEXCqxKwoLUoRYGkJioLkq5nADLuHCoGRJVVZHguOfOl9UGAXAwM9ZEDEXGAnQFB+0QBPMwkq2geHAeLivg8gLGrWRHEgbo7UYWdmBlON9ip8b+z8PMw7GuQpPsYYm6pDK0R7QP7VTLXsMBwrAXyww1vKNI3gcdKSzMnsOg30Ob3rnOnRcXFzE3N4dudwlLy4tYXFwgkffZb8Uz504x7C5/64fff9N/+ZPX/q9/c+7g3fuRrmSBC9gC/FO4gLVPqicL/AUscPDuL+699967f9b5sLsaDE0k2O/T68pIv2bwhP4QHEZx8CJ/8p2cI0aMMcbtcVhbxrjkqmoTKi48Pm1mMDMV/bkwG9ULrGk2iptZbG9mJCaVsPCrvNS3oGIzAxvyZRFiQkfia7xp7z08iTkjGYsMFSpP5YrneQuC4iPitRUCdpTnAGfQVTNo+lRa8WplsRDKISJIzoELDk9Dm1YYXGDUgQTOeoM+jxf6/UjME502tOBZXJyPxHzy5EkcPXoUZ86cQTkkMZPYq+5ytmvL1isevOeeX/y93375L88+fM+BEOLqQd0nJAtcUBbgX9IFpW9SNlngL2UBPaH7+U9//G8feuTgSzn5+8DJXwRRkxAkyMxIKAb6gAA9Nk7mDMG8EIGVq8lXcm1c6fiEMyOBOP8yRgUGa15m5/PMzsfXVHlMNMpkPbNR3UDiW4saRq0JFj8mn2mRY4Uo4TEyzVhI19Q5F0kV5mHybiMc40IGR4I2eDjj4oWEbRE5wHqBbYLRagzNOcAMBhcB8qGZIfYsfQ3xkt2EmFh5MzPoXkRvmuSse6OdjG53RMxaEExMTECLg1MnjuHwIw/j7LnTmKU3/eihQzh57AhcNUDZW+J588TYwrmzP/raV73m3z54++1bVrpIQbLABWUBd0Fpm5RNFvhLWCCcOzfzwVs/+FN3fOn2f1jX5eaSW6Z6GClwO9WTMmpurYJEIKL48/D4blW/pgyFKlPYQOkGylO8CRVfiya/CdeWPT5utsJuKwVm59Nm5+MrxasBORICWMfMIPI2M5h3UJ4jqZoxvQKlRYKC4majMsXXwsxiHzXJ2YwWFQETI7kOZiwPLtZpxmdmo3zmmhnfAZUJMcG3SNL0pBWW3NKemZzAhpkpiLjPnD2Fc6fPYGHuHGbPno4P7J09eRynjh9BNehi7+6dUyeOHf2JWz500z86dzB9n5nmTK8LzAKjv5gLTOmkbrLAV7OA/vchblfv/9SH3vvdb37nG37lU7fc8kucvHe0isIgL5mTvJlBE34IPIslSNgx3eQpbCDPGiTuBk2brxbKa24QPUUqqroM4quJ1+QjQZnKU3zk1bIA1I96Ne1VR+UC5I2SAI1QHCRBIRjoMYdVBOOSIUKtATN7HOgdw8PTG4bPIBjPjlfBfCM8z5Sd8j3rOLbxDm71Se0MxrTRc2Ym4xmDHNJHiDpxR0JPr2uMiJfjOz1svlcsY7D6MjM45+C9X4HBHMfFeuPj49i+Y2t8AOwkPebj9JBrnk2fPnEEvaU5dBdmceTwIZw8fgx79+4eP3Lk8M/f+slbf5T9FkhXssAFZAF+5C8gbZOqyQJfxQKnTt0z+YWPffDFr/ytt/3n333Zb7/7jW943R986mMf+ydnTp3YKx8u/txjqKDvxTozaIvUe5Ff+RhPjZN4TIuUK55vKq24widCBRIhSUNlqtdAaaFRV3FBaYV/Hpp6CgUzEtTjIOIzMxVD/UpfQXFBfcRC1SGCs+gliyyN5AfvIKI3Mzimzc6HWLnMRvIlq4GKzCjLHMxncCLpIoPPCjgRucth8DBzyEjo3nt45quPUdxDcYEKwcwiwMvM2CaLaOpW9JoL77Bj23Yc2L8fG6YmScSL3Lo+ikGvj8X5BZw4cYI4hrvvvQcPPvggxifGt957912/ePenP/0sik2vZIELxgLugtE0KZos8AQWCOHm7ANvec2e3/3Pv/GP/5//9Csv+5N3vvMfnjhy+BlVv7exnXEmL+v4Pd+yP0DF7WptXYu4zCw+pSyiAcma9ATBAk9pCeULdShJu6Reea5PCMqBQT/OwVpoEFbqyskOLG9Ub/IVjogTXASsRWB6DVaI1MzDBA4JzDOGzjkY82qyLDcBUFYB+r6vUHEMgrx29dX0Dzg4nRFz/KP2BlCGYC5bjbMSKJYw1AChcAR2g7Ie6VixeVB7tnV5Bn3PuIHLSK5Fjoxw3sORmOEdRmBfilO2wSPAaSMD8qobopZ9LACO4wQjee6xc+d2PO3pV2HX7h1xITK/uDA8cvz4iaX+4NFjp06fPHrq9Pwdd9+zKDxy/Gjr4Mlj6cdFkK4LyQL8C7mQ1E26Jguct8Cdd9458Su/8Oaf+t2X/+Y7//Sm9/7yiSOHrpoa64zt3LrJ8syh111C4BbncNDnlB8w6DPkBK/vxbaKAuVwCCO5nJcImBmaqyEzhUKT34SPz1NaaMqbsMlTuBYqV/qJQuUJZhZ1MjNAZMzQzGIe30hmiCQuAqvo2QuKC5ItVKxVG+sRaqO4iNFIpD4rkGUkT0KeqeIKHe3UhIo/HmYWiTqQuWvKl26eHrKgp7MbKO2c51BspGdTnzkAiRgWY1CcbN/orbAZC/k4EnBdDlGQ+Ldv3YrLL70MV151OTZu2nLoF//Vv/rN//Sf/8vf+9f/4Zd/5ud+/ud/4cd/+if/5dXXPvNffMsLvu0XN2/b+ZGVDi74IA3gqWGBRMpPjft80Y3yY+9735ZX/Y9f+/m777n9P8ydm70+z/z4JQf2Y/u2Lej3upzqa+QkFlJBJF49MCSC0mTv6bUN+iXr+DjZ6xezzAxmFu1kZnBkAsHMYr4ZJYUQ60uGCEPy5I2OgFWSCiQeEaGguqoXYIA5GMEIdCk/1mGR0kLgm7xbBjBTn8aQpEZCdhyPSDPLcwTcWp0AABAASURBVHj3BD1w1v0PZ2+s98tHj935399564de+2fveuu/eeh/vnXl/P79bFtdE/4K0o9/kS+n4u6T2X99X8wX6iY00N6j9iI8/iJz2U/m7ZJszXgS0w6e2Y6bXhve201z2j+c0zY3Ld6d8T97g1cyp1zXGjB0/w69Z2w+Gv2sC2lPjMeeWqA0H4iVpB38p9a3a9j306aF54mbfG17n5fG7iH0kU/zY826V1p1p1eQe/4u9z2P2/o6/rA5Q88u7N99hlyFpvd17XFp/Y5b/q9z6Z6p92r3P6+D5aI5iC1Yh2n92/hT4g3PjX0YpLqN2p4y4zGvep/z/Y61b2Y37b7j9H9381k3gK8262k/4tP2q0iP2p7+6f8A3j0m4w/l8Z/mAAAAAElFTkSuQmCC',
        nodeName: 'input_image_2',
      },
    },
    {
      id: 'node_1785078196386_79',
      type: 'input.text',
      position: { x: 1159.2018894172827, y: 310.8718042456487 },
      data: {
        text: 'Tạo video cầu bé đang chơi xe ô tô',
        nodeName: 'input_text_1',
      },
    },
    {
      id: 'node_1785078216262',
      type: 'ai.textGen',
      position: { x: 1675.253683050117, y: 440.0617307049818 },
      data: {
        model: 'google/gemini-2.0-flash-exp:free',
        nodeName: 'ai_text_1',
        prompt: 'Animate character with cinematic motion.',
      },
    },
    {
      id: 'node_1785078245473',
      type: 'ai.videoGen',
      position: { x: 2362.4357640473955, y: 377.2913165261314 },
      data: {
        model: 'google/veo-3.1-pro',
        nodeName: 'ai_video_1',
        aspectRatio: '16:9',
        output: {
          previewUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3ZhcTBxaTFhZWhwZHA3dWxpdnRmcDVwZnkyZXRocDRnZnZhbWVzZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/L1R1tvI9svvjDDy267/giphy.gif'
        }
      },
    },
  ],
  edges: [
    {
      id: 'e_1785078426177',
      source: 'node_1785078056303',
      target: 'node_1785078216262',
      sourceHandle: 'out',
      targetHandle: 'image',
    },
    {
      id: 'e_1785078459911',
      source: 'node_1785078196386_79',
      target: 'node_1785078245473',
      sourceHandle: 'out',
      targetHandle: 'text',
    },
    {
      id: 'e_1785078482142',
      source: 'node_1785078086464',
      target: 'node_1785078245473',
      sourceHandle: 'out',
      targetHandle: 'image',
    },
  ],
  viewport: {
    zoom: 0.540583239248229,
    x: -365.2541948388373,
    y: -16.86001171598096,
  },
};

// ─────────────────────────────────────────────
// READ-ONLY MODE: Landing page embedded demo
// ─────────────────────────────────────────────
export function DemoCanvas() {
  const savedStateRef = useRef<ReturnType<typeof canvasEngine.serialize> | null>(null);

  useEffect(() => {
    // Save the real workflow state so we can restore it later
    savedStateRef.current = canvasEngine.serialize();

    // Load the demo workflow
    canvasEngine.deserialize(DEMO_WORKFLOW_DATA as any);

    return () => {
      // On unmount, restore the real workflow
      if (savedStateRef.current) {
        canvasEngine.deserialize(savedStateRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative w-full rounded-2xl border border-white/15 bg-[#0C0C0E] overflow-hidden"
      style={{ height: 540, touchAction: 'none' }}
    >
      {/* Canvas Title Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-2.5 bg-[#0C0C0E]/90 backdrop-blur border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          <span className="text-[11px] text-white/40 font-mono ml-2">
            Cinematic Character Pipeline.flow
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted font-medium">
          <Lock size={10} className="opacity-60" />
          View only · Drag to pan
        </div>
      </div>

      {/* Actual Canvas */}
      <div className="absolute inset-0 top-[41px]">
        <Canvas />
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3">
        <ZoomControls />
        <RecenterButton />
      </div>

      {/* Properties Panel */}
      <PropertiesPanel />
    </div>
  );
}
