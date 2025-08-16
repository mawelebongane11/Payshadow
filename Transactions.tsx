"use client";

import { useState, useEffect } from "react";
import { Transaction } from "@/entities/Transaction";
import { Account } from "@/entities/Account";
import { GhostCard } from "@/entities/GhostCard";
import { Currency } from "@/entities/Currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  History, 
  Search, 
  Filter, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw
} from "lucide-react";
import useAppLevelAuth from "@/hooks/useAppLevelAuth";
import { format } from "date-fns";

export default function Transactions() {
  const { isLoggedIn } = useAppLevelAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [ghostCards, setGhostCards] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    if (!isLoggedIn) return;
    loadData();
  }, [isLoggedIn]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, accountsData, ghostCardsData, currenciesData] = await Promise.all([
        Transaction.list("createdAt:desc"),
        Account.list(),
        GhostCard.list(),
        Currency.list()
      ]);
      setTransactions(transactionsData);
      setAccounts(accountsData);
      setGhostCards(ghostCardsData);
      setCurrencies(currenciesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = 
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.merchantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'ghost_card_creation':
        return <CreditCard className="h-5 w-5 text-purple-600" />;
      case 'ghost_card_payment':
        return <ArrowUpRight className="h-5 w-5 text-red-600" />;
      case 'ghost_card_refund':
        return <ArrowDownLeft className="h-5 w-5 text-green-600" />;
      case 'account_transfer':
        return <RefreshCw className="h-5 w-5 text-blue-600" />;
      case 'currency_exchange':
        return <RefreshCw className="h-5 w-5 text-orange-600" />;
      default:
        return <History className="h-5 w-5 text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string, riskScore?: number) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600 text-white gap-1"><CheckCircle className="h-3 w-3" />Completed</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-600 text-white gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
      case 'failed':
        return <Badge className="bg-red-600 text-white gap-1"><AlertTriangle className="h-3 w-3" />Failed</Badge>;
      case 'flagged':
        return <Badge className="bg-orange-600 text-white gap-1"><Shield className="h-3 w-3" />Flagged</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 30) return "text-green-600";
    if (score <= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const formatTransactionType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!isLoggedIn) return null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 rounded w-48 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-slate-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Transaction History
          </h1>
          <p className="text-slate-600 mt-1">Monitor all your banking activities and security alerts</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ghost_card_creation">Card Creation</SelectItem>
                <SelectItem value="ghost_card_payment">Card Payment</SelectItem>
                <SelectItem value="ghost_card_refund">Card Refund</SelectItem>
                <SelectItem value="account_transfer">Account Transfer</SelectItem>
                <SelectItem value="currency_exchange">Currency Exchange</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <History className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No transactions found</h3>
            <p className="text-slate-600">
              {searchTerm || statusFilter !== "all" || typeFilter !== "all" 
                ? "Try adjusting your search criteria" 
                : "Your transaction history will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((transaction) => {
            const sourceAccount = accounts.find(acc => acc.id === transaction.fromAccountId);
            const targetAccount = accounts.find(acc => acc.id === transaction.toAccountId);
            const ghostCard = ghostCards.find(card => card.id === transaction.ghostCardId);
            const currencySymbol = currencies.find(c => c.code === transaction.currency)?.symbol || '$';
            
            return (
              <Card key={transaction.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 bg-slate-100 rounded-lg">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800">
                            {transaction.description || formatTransactionType(transaction.type)}
                          </h3>
                          {getStatusBadge(transaction.status, transaction.riskScore)}
                        </div>
                        
                        <div className="space-y-1 text-sm text-slate-600">
                          <p>{format(new Date(transaction.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                          
                          {transaction.merchantName && (
                            <p>Merchant: {transaction.merchantName}</p>
                          )}
                          
                          {sourceAccount && (
                            <p>From: {sourceAccount.accountName}</p>
                          )}
                          
                          {targetAccount && transaction.fromAccountId !== transaction.toAccountId && (
                            <p>To: {targetAccount.accountName}</p>
                          )}
                          
                          {ghostCard && (
                            <p>Ghost Card: •••• {ghostCard.cardNumber.slice(-4)}</p>
                          )}
                          
                          {transaction.location && (
                            <p>Location: {transaction.location}</p>
                          )}
                        </div>
                        
                        {transaction.fraudFlags && transaction.fraudFlags.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {transaction.fraudFlags.map((flag: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {flag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className={`text-xl font-bold ${
                        transaction.type === 'ghost_card_refund' || transaction.type === 'account_transfer' && transaction.toAccountId 
                          ? 'text-green-600' 
                          : 'text-slate-800'
                      }`}>
                        {transaction.type === 'ghost_card_refund' ? '+' : ''}
                        {currencySymbol}{transaction.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-slate-500">{transaction.currency}</p>
                      
                      {typeof transaction.riskScore === 'number' && (
                        <div className="mt-2">
                          <p className="text-xs text-slate-500">Risk Score</p>
                          <p className={`text-sm font-semibold ${getRiskScoreColor(transaction.riskScore)}`}>
                            {transaction.riskScore}/100
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}