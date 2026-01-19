using backend.DTOs;

namespace backend.Services.Payment.Interfaces
{
    public interface IPaymentService
    {
        /// <summary>
        /// Initiate a card payment through PayHere gateway
        /// </summary>
        Task<PaymentResponseDto> InitiateCardPaymentAsync(PaymentRequestDto request, string userId);

        /// <summary>
        /// Process wallet payment
        /// </summary>
        Task<PaymentResponseDto> ProcessWalletPaymentAsync(PaymentRequestDto request, string userId);

        /// <summary>
        /// Verify PayHere payment callback
        /// </summary>
        Task<bool> VerifyPayHereCallbackAsync(Dictionary<string, string> callbackData);
    }
}
