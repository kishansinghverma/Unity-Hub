import express from 'express';

const router = express.Router();

// router.get("/api/transactions", (req, res) => {
//     res.status(200).json(GetAllTransactions());
// });

// router.post("/api/transactions", (req, res) => {
//     if (Object.keys(req.body).length > 0 && req.body.Location) {
//         try {
//             AddTransaction(req.body);
//             res.status(201).end();
//         }
//         catch (e) { res.status(500).send(e.message) }
//     }
//     else
//         res.status(400).send("Bad Request: Parameters Missing");
// })

// router.delete("/api/transactions/:Id", (req, res) => {
//     const status = DeleteTransaction(req.params.Id);
//     res.status(status).end();
// });

export default router;