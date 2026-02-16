
import React, { useState, useEffect } from "react";
import { Star, MessageSquare } from "lucide-react";
import socketService from "@/services/socketService";
import { formatDistanceToNow } from "date-fns";

const RatingsReviews = ({ restaurantId, initialReviews = [], initialRatings = { average: 0, totalReviews: 0 } }) => {
    const [reviews, setReviews] = useState(initialReviews);
    const [ratings, setRatings] = useState(initialRatings);

    useEffect(() => {
        // Sync with props if they change (e.g. initial fetch)
        setReviews(initialReviews);
        setRatings(initialRatings);
    }, [initialReviews, initialRatings]);

    useEffect(() => {
        if (!restaurantId) return;

        const handleNewReview = (newReview) => {
            setReviews(prev => [newReview, ...prev]);

            // Optimistically update average rating
            setRatings(prev => {
                const newTotal = prev.totalReviews + 1;
                // Calculate new average: ((oldAvg * oldTotal) + newRating) / newTotal
                // Use safe parsing
                const currentAvg = parseFloat(prev.average) || 0;
                const newAvg = ((currentAvg * prev.totalReviews) + newReview.rating) / newTotal;

                return {
                    totalReviews: newTotal,
                    average: newAvg.toFixed(1)
                };
            });
        };

        socketService.onReviewAdded(handleNewReview);

        return () => {
            socketService.offReviewAdded(handleNewReview);
        };
    }, [restaurantId]);

    // Calculate distribution
    const distribution = [5, 4, 3, 2, 1].map(star => {
        const count = reviews.filter(r => r.rating === star).length;
        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
        return { star, count, percentage };
    });

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-6 border-b border-border">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <Star className="text-yellow-400 fill-current" size={20} />
                    Ratings & Reviews
                </h3>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Summary Section */}
                <div className="text-center md:text-left">
                    <div className="text-5xl font-bold text-foreground mb-2">{ratings.average}</div>
                    <div className="flex justify-center md:justify-start gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={16}
                                className={`${star <= Math.round(ratings.average) ? "text-yellow-400 fill-current" : "text-gray-300 dark:text-gray-600"}`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground">{ratings.totalReviews} total reviews</p>
                </div>

                {/* Distribution Bars */}
                <div className="col-span-2 space-y-2">
                    {distribution.map((item) => (
                        <div key={item.star} className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1 w-12 font-medium">
                                {item.star} <Star size={12} className="fill-current text-muted-foreground" />
                            </div>
                            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                    style={{ width: `${item.percentage}%` }}
                                ></div>
                            </div>
                            <div className="w-8 text-right text-muted-foreground text-xs">{item.count}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reviews List */}
            <div className="flex-1 overflow-y-auto border-t border-border bg-muted/20 max-h-[400px]">
                {reviews.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        <MessageSquare size={32} className="mx-auto mb-3 opacity-50" />
                        <p>No reviews yet.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {reviews.map((review, idx) => (
                            <div key={idx} className="p-4 hover:bg-card transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="font-bold text-sm text-foreground">{review.customerName || "Guest"}</div>
                                        <div className="flex text-yellow-400">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={12} className={i < review.rating ? "fill-current" : "text-muted stroke-muted-foreground"} />
                                            ))}
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {review.createdAt ? formatDistanceToNow(new Date(review.createdAt), { addSuffix: true }) : 'Just now'}
                                    </span>
                                </div>
                                {review.comment && (
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        "{review.comment}"
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RatingsReviews;
